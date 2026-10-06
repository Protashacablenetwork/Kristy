import { Member, CollectionRecord, SystemSettings, AppUser, BannerConfig } from '../types';
import { INITIAL_MEMBERS, INITIAL_COLLECTIONS, INITIAL_SETTINGS } from '../data/initialData';
import { fetchFromGoogleSheet, postDeleteMemberToGoogleSheet } from './googleSheetSync';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    password: 'admin812',
    name: 'ম্যানেজার (অ্যাডমিন)',
    phone: '01711223344',
    role: 'admin',
    isOnline: true,
    lastActive: new Date().toISOString(),
    createdAt: '2026-01-01'
  },
  {
    id: 'usr-collector1',
    username: 'shipon',
    password: '123456',
    name: 'মোঃ শিপন (ফিল্ড অফিসার)',
    phone: '01812345678',
    role: 'user',
    isOnline: false,
    lastActive: new Date(Date.now() - 1200000).toISOString(), // 20 mins ago
    createdAt: '2026-01-10'
  },
  {
    id: 'usr-viewer1',
    username: 'viewer',
    password: '123456',
    name: 'সাধারণ পর্যবেক্ষক (ভিউয়ার)',
    phone: '01900000000',
    role: 'viewer',
    isOnline: false,
    lastActive: new Date(Date.now() - 86400000).toISOString(), // yesterday
    createdAt: '2026-02-01'
  }
];

export function isOldTestMember(m: any): boolean {
  if (!m) return true;
  const idStr = String(m?.id || '').trim();
  const nameStr = String(m?.name || '').trim();

  if (!idStr && !nameStr) return true;

  // Filter out any corrupted CSS/HTML entries that leaked from warmup pages
  const combined = (idStr + ' ' + nameStr).toLowerCase();
  if (
    combined.includes('font-family') ||
    combined.includes('color:') ||
    combined.includes('background') ||
    combined.includes('light-dark') ||
    combined.includes('rgba(') ||
    combined.includes('border:') ||
    combined.includes('sessionstorage') ||
    combined.includes('postmessage') ||
    combined.includes('warmup') ||
    combined.includes('helvetica') ||
    combined.includes('arial') ||
    combined.includes('persists') ||
    combined.includes('reload') ||
    combined.includes('iframe') ||
    combined.includes('issue during') ||
    idStr.startsWith('//') ||
    idStr.includes(';') ||
    idStr.includes('{') ||
    idStr.includes('}') ||
    nameStr.includes(';') ||
    nameStr.includes('{') ||
    nameStr.includes('}') ||
    nameStr.startsWith('#')
  ) {
    return true;
  }

  // Filter out invalid test/dummy record Sel0007 / া্বাব
  if (idStr.toLowerCase() === 'sel0007' || nameStr.includes('া্বাব')) return true;

  // Filter out legacy dummy demo members Mel24456...
  if (/^mel24456\d*/i.test(idStr)) return true;

  // Sel... are the real authentic members from Google Sheet!
  if (/^sel\d+/i.test(idStr)) return false;

  // Filter out dev test timestamp IDs
  if (/^178971\d+$/i.test(idStr)) return true;
  if (['test_dummy', 'dummy_member'].includes(idStr.toLowerCase())) return true;

  return false;
}

export function isOldTestCollection(c: any): boolean {
  if (!c) return true;
  const idStr = String(c?.id || '').trim();
  const memIdStr = String(c?.memberId || '').trim();
  const nameStr = String(c?.memberName || '').trim();
  const recStr = String(c?.receiptNo || '').trim();

  // Filter out invalid test/dummy record Sel0007 / া্বাব
  if (memIdStr.toLowerCase() === 'sel0007' || nameStr.includes('া্বাব')) {
    return true;
  }

  // Filter out legacy Mel244 collections
  if (memIdStr.toLowerCase().startsWith('mel244') || idStr.toLowerCase().includes('mel244') || recStr.toLowerCase().includes('mel244')) {
    return true;
  }

  // Sel collections are valid
  if (memIdStr.toLowerCase().startsWith('sel')) {
    return false;
  }

  const combined = `${idStr} ${memIdStr} ${nameStr} ${recStr}`.toLowerCase();
  if (
    combined.includes('font-family') ||
    combined.includes('color:') ||
    combined.includes('light-dark') ||
    combined.includes('background') ||
    combined.includes('{') ||
    combined.includes('}') ||
    combined.includes(';') ||
    /^178971\d+$/i.test(idStr)
  ) {
    return true;
  }
  return false;
}

export function getLocalDeletedIds(): { deletedMemberIds: string[]; deletedCollectionIds: string[] } {
  try {
    const mStr = localStorage.getItem('somiti_deleted_member_ids_v3');
    const cStr = localStorage.getItem('somiti_deleted_collection_ids_v3');
    return {
      deletedMemberIds: mStr ? JSON.parse(mStr) : [],
      deletedCollectionIds: cStr ? JSON.parse(cStr) : []
    };
  } catch {
    return { deletedMemberIds: [], deletedCollectionIds: [] };
  }
}

export function addDeletedMemberId(id: string | number) {
  try {
    const { deletedMemberIds } = getLocalDeletedIds();
    const idStr = String(id);
    if (!deletedMemberIds.includes(idStr)) {
      deletedMemberIds.push(idStr);
      localStorage.setItem('somiti_deleted_member_ids_v3', JSON.stringify(deletedMemberIds));
    }
  } catch {}
}

export function addDeletedCollectionId(id: string) {
  try {
    const { deletedCollectionIds } = getLocalDeletedIds();
    const idStr = String(id);
    if (!deletedCollectionIds.includes(idStr)) {
      deletedCollectionIds.push(idStr);
      localStorage.setItem('somiti_deleted_collection_ids_v3', JSON.stringify(deletedCollectionIds));
    }
  } catch {}
}

export async function loadSomitiData(): Promise<{
  members: Member[];
  collections: CollectionRecord[];
  settings: SystemSettings;
  users: AppUser[];
  bannerConfig?: BannerConfig;
  updatedAt?: number;
}> {
  const { deletedMemberIds, deletedCollectionIds } = getLocalDeletedIds();
  const delMemberSet = new Set(deletedMemberIds.map(String));
  const delColSet = new Set(deletedCollectionIds.map(String));

  // 1. Load local cached state first (filtering out old dummy test entries)
  let localMembers: Member[] = [];
  let localCols: CollectionRecord[] = [];
  try {
    if (typeof localStorage !== 'undefined') {
      const mStr = localStorage.getItem('somiti_members_v3');
      if (mStr) {
        const parsed = JSON.parse(mStr);
        if (Array.isArray(parsed)) {
          localMembers = parsed.filter((m: any) => !isOldTestMember(m));
          if (localMembers.length !== parsed.length) {
            localStorage.setItem('somiti_members_v3', JSON.stringify(localMembers));
          }
        }
      }
      const cStr = localStorage.getItem('somiti_collections_v3');
      if (cStr) {
        const parsedCols = JSON.parse(cStr);
        if (Array.isArray(parsedCols)) {
          localCols = parsedCols.filter((c: any) => {
            const combined = `${c.id} ${c.memberId} ${c.memberName}`.toLowerCase();
            return !combined.includes('font-family') && !combined.includes('light-dark') && !combined.includes('{');
          });
          if (localCols.length !== parsedCols.length) {
            localStorage.setItem('somiti_collections_v3', JSON.stringify(localCols));
          }
        }
      }
    }
  } catch {}

  let settings: SystemSettings = INITIAL_SETTINGS;
  try {
    if (typeof localStorage !== 'undefined') {
      const settingsStr = localStorage.getItem('somiti_settings_v3');
      if (settingsStr) settings = JSON.parse(settingsStr);
    }
  } catch {}

  let users: AppUser[] = INITIAL_USERS;
  try {
    if (typeof localStorage !== 'undefined') {
      const usersStr = localStorage.getItem('somiti_users_v3');
      if (usersStr) users = JSON.parse(usersStr);
    }
  } catch {}

  // 1.5 Load central store from backend /api/somiti
  let serverMembers: Member[] | null = null;
  let serverCols: CollectionRecord[] | null = null;
  try {
    const res = await fetch('/api/somiti', { cache: 'no-store' });
    if (res.ok) {
      const sData = await res.json();
      if (Array.isArray(sData.members) && sData.members.length > 0) {
        serverMembers = sData.members.filter((m: any) => !isOldTestMember(m));
      }
      if (Array.isArray(sData.collections) && sData.collections.length > 0) {
        serverCols = sData.collections.filter((c: any) => !isOldTestCollection(c));
      }
      if (sData.settings) {
        settings = { ...settings, ...sData.settings };
      }
      if (Array.isArray(sData.users) && sData.users.length > 0) {
        users = sData.users;
      }
    }
  } catch (apiErr) {
    console.warn('/api/somiti load skipped:', apiErr);
  }

  // 2. Load persistent cloud data from Firestore
  let firestoreMembers: Member[] | null = null;
  let firestoreCols: CollectionRecord[] | null = null;
  try {
    if (db) {
      const snap = await getDoc(doc(db, 'somiti_data', 'main'));
      if (snap.exists()) {
        const fsData = snap.data();
        if (Array.isArray(fsData.members) && fsData.members.length > 0) {
          firestoreMembers = fsData.members.filter((m: any) => !isOldTestMember(m));
        }
        if (Array.isArray(fsData.collections)) {
          firestoreCols = fsData.collections.filter((c: any) => !isOldTestCollection(c));
        }
      }
    }
  } catch (fsErr) {
    console.warn('Firestore load warning:', fsErr);
  }

  // Combine server, local, and Firestore base data (preserving any member added locally or in cloud)
  const memberMap = new Map<string, Member>();
  (serverMembers || []).forEach((m) => {
    if (!delMemberSet.has(String(m.id)) && !isOldTestMember(m)) {
      memberMap.set(String(m.id).toLowerCase(), m);
    }
  });
  (firestoreMembers || []).forEach((m) => {
    if (!delMemberSet.has(String(m.id)) && !isOldTestMember(m)) {
      memberMap.set(String(m.id).toLowerCase(), m);
    }
  });
  (localMembers || []).forEach((m) => {
    if (!delMemberSet.has(String(m.id)) && !isOldTestMember(m)) {
      const existing = memberMap.get(String(m.id).toLowerCase());
      memberMap.set(String(m.id).toLowerCase(), {
        ...existing,
        ...m,
        months: { ...(existing?.months || {}), ...(m.months || {}) }
      });
    }
  });
  const baseMembers = Array.from(memberMap.values());

  const colMap = new Map<string, CollectionRecord>();
  (serverCols || []).forEach((c) => {
    if (!delColSet.has(String(c.id)) && !delMemberSet.has(String(c.memberId)) && !isOldTestCollection(c)) {
      colMap.set(String(c.receiptNo || c.id), c);
    }
  });
  (firestoreCols || []).forEach((c) => {
    if (!delColSet.has(String(c.id)) && !delMemberSet.has(String(c.memberId)) && !isOldTestCollection(c)) {
      colMap.set(String(c.receiptNo || c.id), c);
    }
  });
  (localCols || []).forEach((c) => {
    if (!delColSet.has(String(c.id)) && !delMemberSet.has(String(c.memberId)) && !isOldTestCollection(c)) {
      colMap.set(String(c.receiptNo || c.id), c);
    }
  });
  const baseCols = Array.from(colMap.values());

  // 3. Fetch from Google Sheet (Sync sheet data with local/server data without deleting new local members)
  try {
    const data = await fetchFromGoogleSheet(settings.googleSheetUrl, settings.googleAppsScriptUrl);
    
    const cleanSheetMembers = (data.members || []).filter((sm) => !isOldTestMember(sm));
    if (cleanSheetMembers.length > 0) {
      // Unblock any sheet members in case they were previously deleted
      cleanSheetMembers.forEach((sm) => {
        delMemberSet.delete(String(sm.id));
        delMemberSet.delete(String(sm.id).toLowerCase());
      });
      const sheetMemberIdSet = new Set(cleanSheetMembers.map((sm) => String(sm.id).toLowerCase().trim()));
      const sheetMemberNameSet = new Set(cleanSheetMembers.map((sm) => sm.name.trim().toLowerCase()));

      // Map sheet members, retaining local photos and newer local installments
      const mappedSheetMembers: Member[] = cleanSheetMembers.map((sm) => {
        const localMem = baseMembers.find(
          (m) =>
            String(m.id).toLowerCase().trim() === String(sm.id).toLowerCase().trim() ||
            m.name.trim().toLowerCase() === sm.name.trim().toLowerCase()
        );
        return {
          ...sm,
          photo: sm.photo || localMem?.photo,
          months: { ...(localMem?.months || {}), ...(sm.months || {}) }
        };
      });

      // CRITICAL: Preserve all locally/firestore created members that haven't yet propagated to Google Sheet!
      const pendingNewMembers = baseMembers.filter((bm) => {
        const idLower = String(bm.id).toLowerCase().trim();
        const nameLower = bm.name.trim().toLowerCase();
        if (delMemberSet.has(String(bm.id))) return false;
        if (isOldTestMember(bm)) return false;
        if (sheetMemberIdSet.has(idLower) || sheetMemberNameSet.has(nameLower)) return false;
        return true;
      });

      const finalMembers: Member[] = [...mappedSheetMembers, ...pendingNewMembers];

      // Collections: Keep newly collected items that haven't appeared in Google Sheet yet
      const sheetColKeys = new Set((data.collections || []).map((sc) => String(sc.receiptNo || sc.id)));
      const mappedSheetCols = (data.collections || []).filter(
        (sc) => !delColSet.has(String(sc.id)) && !delMemberSet.has(String(sc.memberId)) && !isOldTestCollection(sc)
      );
      const pendingNewCols = baseCols.filter(
        (bc) => !sheetColKeys.has(String(bc.receiptNo || bc.id)) &&
                !delColSet.has(String(bc.id)) &&
                !delMemberSet.has(String(bc.memberId)) &&
                !isOldTestCollection(bc)
      );

      const finalCollections: CollectionRecord[] = [...mappedSheetCols, ...pendingNewCols];

      // Cache fresh merged data locally
      try {
        localStorage.setItem('somiti_members_v3', JSON.stringify(finalMembers));
        localStorage.setItem('somiti_collections_v3', JSON.stringify(finalCollections));
      } catch {}

      // Persist merged data to Server & Firestore in background
      saveSomitiData({
        members: finalMembers,
        collections: finalCollections,
        settings,
        users
      }).catch(() => {});

      return { members: finalMembers, collections: finalCollections, settings, users };
    }
  } catch (e) {
    console.warn('Google Sheet fetch fallback to local/server/firestore:', e);
  }

  // 4. Fallback to base members and collections if Google Sheet is unreachable or still loading
  const finalLocalMembers = baseMembers.length > 0 ? baseMembers : INITIAL_MEMBERS;
  const finalLocalCols = baseCols.length > 0 ? baseCols : INITIAL_COLLECTIONS;

  return {
    members: finalLocalMembers,
    collections: finalLocalCols,
    settings,
    users
  };
}

export async function saveSomitiData(data: {
  members: Member[];
  collections: CollectionRecord[];
  settings: SystemSettings;
  users?: AppUser[];
  bannerConfig?: BannerConfig;
}) {
  // 1. Save locally for instant offline availability
  try {
    localStorage.setItem('somiti_members_v3', JSON.stringify(data.members));
    localStorage.setItem('somiti_collections_v3', JSON.stringify(data.collections));
    localStorage.setItem('somiti_settings_v3', JSON.stringify(data.settings));
    if (data.users) localStorage.setItem('somiti_users_v3', JSON.stringify(data.users));
    if (data.bannerConfig) localStorage.setItem('somiti_banner_config_v1', JSON.stringify(data.bannerConfig));
  } catch {}

  // 2. Persist to Express Central Server (/api/somiti)
  try {
    fetch('/api/somiti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        members: data.members,
        collections: data.collections,
        settings: data.settings,
        users: data.users,
        bannerConfig: data.bannerConfig
      })
    }).catch(() => {});
  } catch {}

  // 3. Persist to Firestore Cloud Database
  try {
    if (db) {
      const cleanMembers = JSON.parse(JSON.stringify(data.members || []));
      const cleanCollections = JSON.parse(JSON.stringify(data.collections || []));
      const cleanSettings = JSON.parse(JSON.stringify(data.settings || {}));
      const cleanUsers = JSON.parse(JSON.stringify(data.users || []));
      await setDoc(doc(db, 'somiti_data', 'main'), {
        members: cleanMembers,
        collections: cleanCollections,
        settings: cleanSettings,
        users: cleanUsers,
        bannerConfig: data.bannerConfig ? JSON.parse(JSON.stringify(data.bannerConfig)) : null,
        updatedAt: Date.now()
      });
    }
  } catch (fsErr) {
    console.warn('Firestore setDoc warning:', fsErr);
  }

  return true;
}

// Aliases for compatibility
export const loadSomitiDataFromFirestore = loadSomitiData;
export const saveSomitiDataToFirestore = saveSomitiData;

export async function deleteMemberFromServer(
  memberId: string | number,
  webhookUrl?: string
): Promise<boolean> {
  addDeletedMemberId(memberId);
  try {
    fetch(`/api/somiti/members/${encodeURIComponent(String(memberId))}`, { method: 'DELETE' }).catch(() => {});
  } catch {}
  postDeleteMemberToGoogleSheet(memberId, webhookUrl).catch(() => {});
  return true;
}

export async function deleteCollectionFromServer(collectionId: string, updatedMembers?: Member[]): Promise<boolean> {
  addDeletedCollectionId(collectionId);
  try {
    fetch(`/api/somiti/collections/${encodeURIComponent(String(collectionId))}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updatedMembers })
    }).catch(() => {});
  } catch {}
  if (updatedMembers) {
    try {
      localStorage.setItem('somiti_members_v3', JSON.stringify(updatedMembers));
    } catch {}
  }
  return true;
}

export async function deleteUserFromServer(userId: string): Promise<boolean> {
  return true;
}

export function startMultiUserSyncPolling(
  onData: (data: {
    members: Member[];
    collections: CollectionRecord[];
    settings: SystemSettings;
    users: AppUser[];
    bannerConfig?: BannerConfig;
  }) => void,
  intervalMs = 20000
): () => void {
  const timer = setInterval(async () => {
    try {
      const fresh = await loadSomitiData();
      onData(fresh);
    } catch {}
  }, intervalMs);

  return () => clearInterval(timer);
}

export function clearLocalCache() {
  try {
    localStorage.removeItem('somiti_members_v3');
    localStorage.removeItem('somiti_collections_v3');
    localStorage.removeItem('somiti_deleted_member_ids_v3');
    localStorage.removeItem('somiti_deleted_collection_ids_v3');
  } catch {}
}

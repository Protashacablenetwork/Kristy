import { BannerConfig, BannerItem } from '../types';

export const DEFAULT_BANNERS: BannerItem[] = [
  {
    id: 'b1',
    title: 'দশ তারা সমবায় সমিতি লিমিটেড',
    subtitle: 'নিয়মিত কিস্তি পরিশোধ করুন ও স্বচ্ছ সঞ্চয়ের সাথে ভবিষ্যৎ গড়ুন',
    badge: 'বিশেষ সেবা',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1000&q=80',
    bgGradient: 'from-[#B50058] to-[#80003E]',
    buttonText: 'ট্যাপ করুন',
    linkType: 'todayPaid',
    isActive: true
  },
  {
    id: 'b2',
    title: 'সহজ শর্তে ঋণ ও আকর্ষণীয় সঞ্চয়',
    subtitle: '১০ মাস মেয়াদে মাত্র ২০% লাভে দ্রুত কিস্তি সুবিধা',
    badge: 'ঋণ অফার',
    imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1000&q=80',
    bgGradient: 'from-[#C40C64] to-[#7B003A]',
    buttonText: 'হিসাব দেখুন',
    linkType: 'calculator',
    isActive: true
  },
  {
    id: 'b3',
    title: 'ডিজিটাল কিস্তি ও তাৎক্ষণিক রসিদ',
    subtitle: 'কিস্তি জমার সাথে সাথে স্বয়ংক্রিয় মানি রিসিট প্রস্তুত ও প্রিন্ট করুন',
    badge: 'স্মার্ট সমবায়',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1000&q=80',
    bgGradient: 'from-[#A1004E] to-[#60002F]',
    buttonText: 'রিপোর্ট দেখুন',
    linkType: 'reports',
    isActive: true
  },
  {
    id: 'b4',
    title: 'টানা ব্রীজ আনন্দ বাজার শাখা',
    subtitle: 'ইসলামপুর, জামালপুর • মোবাইল : 01982-972228',
    badge: 'যোগাযোগ',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80',
    bgGradient: 'from-[#8C0044] to-[#4F0026]',
    buttonText: 'সদস্য তালিকা',
    linkType: 'members',
    isActive: true
  }
];

export const DEFAULT_BANNER_CONFIG: BannerConfig = {
  intervalSeconds: 4,
  autoPlay: true,
  banners: DEFAULT_BANNERS
};

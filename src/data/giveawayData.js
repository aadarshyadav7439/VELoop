import giftBox from "../assets/giveaway-gift-box.png";
import giftGlow from "../assets/giveaway-gift-glow.png";
import ticket from "../assets/giveaway-ticket.png";
import iphone from "../assets/iphone-15-pro.png";
import watch from "../assets/apple-watch.png";
import airpods from "../assets/airpods-pro.png";
import amazon2000 from "../assets/amazon-gift-card-2000.png";
import amazon500 from "../assets/amazon-gift-card-500.png";
import amazon20 from "../assets/amazon-gift-card-20.png";

export const PRIZE_TYPES = { PHYSICAL: "PHYSICAL", GIFT_CARD: "GIFT_CARD", DIGITAL: "DIGITAL" };
export const CLAIM_TYPES = { PHYSICAL: "PHYSICAL", EMAIL: "EMAIL" };

export const giveawayCatalog = {
  current: {
    id: "GW-2026-09",
    slug: "september-rewards",
    title: "September Rewards",
    heroTitle: "Something valuable could be yours.",
    subtitle: "Complete tasks. Earn entries. Get rewarded.",
    description: "Explore premium rewards, understand the exact entry requirement, and participate with confidence.",
    status: "active",
    startAt: "2026-09-01T00:00:00+05:30",
    endAt: "2026-09-20T23:59:59+05:30",
    participants: 8500,
    totalGiveaways: 24,
    prizesWon: 1200,
    winnerAnnouncementAt: "2026-09-21T12:00:00+05:30",
    nextStartAt: "2026-09-24T12:00:00+05:30",
    claimWindowDays: 7,
    featuredPrizeId: "PRIZE-001",
    eligibility: "Eligible VELOOP users who meet the published participation requirements.",
    participationSettings: {
      oneParticipationPerUser: true,
      additionalEntriesAllowed: false,
      reEntryAllowed: false,
      taskEntriesEnabled: true,
      demoLabel: "Mock configuration — replace with the final VELOOP policy before production."
    },
    rules: [
      { title: "Eligibility", text: "Only eligible VELOOP accounts that satisfy the published event requirements may participate." },
      { title: "Entry requirement", text: "The exact currency and amount are displayed on every reward before confirmation." },
      { title: "Participation", text: "The demo uses one participation per user per reward. Real participation rules should come from the backend." },
      { title: "Winner selection", text: "Winners are finalized after the event closes according to the configured selection process." },
      { title: "Claim period", text: "Winners must submit the required fulfillment details within the configured claim window." },
      { title: "Fraud & abuse", text: "Suspicious, fraudulent, abusive or rule-breaking activity may be rejected or reviewed under platform rules." },
      { title: "Entry/refund policy", text: "Placeholder: the final VELOOP policy for consumed entry currency must be confirmed before production launch." }
    ],
    prizes: [
      { id:"PRIZE-001", slug:"iphone-15-pro", position:1, name:"iPhone 15 Pro", description:"A premium smartphone reward for one selected participant.", image:iphone, winnerCount:1, participants:2300, prizeType:PRIZE_TYPES.PHYSICAL, claimType:CLAIM_TYPES.PHYSICAL, entry:{currency:"VEs",amount:250}, featured:true, valueLabel:"Prize value: demo / confirm", fulfillment:"Physical delivery after winner verification." },
      { id:"PRIZE-002", slug:"apple-watch", position:2, name:"Apple Watch", description:"A premium smartwatch reward for selected participants.", image:watch, winnerCount:3, participants:1900, prizeType:PRIZE_TYPES.PHYSICAL, claimType:CLAIM_TYPES.PHYSICAL, entry:{currency:"VEs",amount:200}, featured:true, valueLabel:"Prize value: demo / confirm", fulfillment:"Physical delivery after winner verification." },
      { id:"PRIZE-003", slug:"airpods-pro", position:3, name:"AirPods Pro", description:"Premium wireless audio for selected participants.", image:airpods, winnerCount:5, participants:1700, prizeType:PRIZE_TYPES.PHYSICAL, claimType:CLAIM_TYPES.PHYSICAL, entry:{currency:"SVEs",amount:500}, featured:true, valueLabel:"Prize value: demo / confirm", fulfillment:"Physical delivery after winner verification." },
      { id:"PRIZE-004", slug:"amazon-2000", position:4, name:"₹2,000 Amazon Gift Card", description:"A digital gift card delivered to the winner's email.", image:amazon2000, winnerCount:10, participants:1400, prizeType:PRIZE_TYPES.GIFT_CARD, claimType:CLAIM_TYPES.EMAIL, entry:{currency:"VEs",amount:500}, featured:false, valueLabel:"₹2,000", fulfillment:"Digital delivery to the verified claim email." },
      { id:"PRIZE-005", slug:"amazon-500", position:5, name:"₹500 Amazon Gift Card", description:"A digital gift card delivered to the winner's email.", image:amazon500, winnerCount:10, participants:1100, prizeType:PRIZE_TYPES.GIFT_CARD, claimType:CLAIM_TYPES.EMAIL, entry:{currency:"VEs",amount:300}, featured:false, valueLabel:"₹500", fulfillment:"Digital delivery to the verified claim email." },
      { id:"PRIZE-006", slug:"amazon-20", position:6, name:"₹20 Amazon Voucher", description:"A digital reward for selected participants.", image:amazon20, winnerCount:20, participants:900, prizeType:PRIZE_TYPES.GIFT_CARD, claimType:CLAIM_TYPES.EMAIL, entry:{currency:"Tokens",amount:2000}, featured:false, valueLabel:"₹20", fulfillment:"Digital delivery to the verified claim email." }
    ]
  }
};

export const previousGiveaways = [
  { id:"GW-2026-08", slug:"august-reward-rush", title:"August Reward Rush", status:"ended", endedAt:"2026-08-10T23:59:59+05:30", winners:[
    {userId:"VE10042",displayId:"VE****42",prizeId:"AUG-001",prizeName:"iPhone 15 Pro",prizeType:PRIZE_TYPES.PHYSICAL,wonAt:"2026-08-10T18:30:00+05:30",status:"WON"},
    {userId:"VE10091",displayId:"VE****91",prizeId:"AUG-002",prizeName:"Apple Watch Series 9",prizeType:PRIZE_TYPES.PHYSICAL,wonAt:"2026-08-10T18:31:00+05:30",status:"WON"},
    {userId:"VE10027",displayId:"VE****27",prizeId:"AUG-003",prizeName:"AirPods Pro",prizeType:PRIZE_TYPES.PHYSICAL,wonAt:"2026-08-10T18:32:00+05:30",status:"WON"}
  ]}
];

export const currentGiveawayWinners = [
  {userId:"VE10101",displayId:"VE****01",prizeId:"PRIZE-001",prizeName:"iPhone 15 Pro",giveawayId:"GW-2026-09",status:"WON",claimStatus:"COMPLETED",claimDeadline:"2026-09-28T23:59:59+05:30"},
  {userId:"VE10025",displayId:"VE****25",prizeId:"PRIZE-002",prizeName:"Apple Watch",giveawayId:"GW-2026-09",status:"WON",claimStatus:"NOT_SUBMITTED",claimDeadline:"2026-09-28T23:59:59+05:30"},
  {userId:"VE10103",displayId:"VE****03",prizeId:"PRIZE-002",prizeName:"Apple Watch",giveawayId:"GW-2026-09",status:"WON",claimStatus:"SUBMITTED",claimDeadline:"2026-09-28T23:59:59+05:30"},
  {userId:"VE10104",displayId:"VE****04",prizeId:"PRIZE-002",prizeName:"Apple Watch",giveawayId:"GW-2026-09",status:"WON",claimStatus:"PROCESSING",claimDeadline:"2026-09-28T23:59:59+05:30"},
  {userId:"VE10105",displayId:"VE****05",prizeId:"PRIZE-003",prizeName:"AirPods Pro",giveawayId:"GW-2026-09",status:"WON",claimStatus:"COMPLETED",claimDeadline:"2026-09-28T23:59:59+05:30"},
  {userId:"VE10106",displayId:"VE****06",prizeId:"PRIZE-003",prizeName:"AirPods Pro",giveawayId:"GW-2026-09",status:"WON",claimStatus:"SUBMITTED",claimDeadline:"2026-09-28T23:59:59+05:30"},
  {userId:"VE10107",displayId:"VE****07",prizeId:"PRIZE-003",prizeName:"AirPods Pro",giveawayId:"GW-2026-09",status:"WON",claimStatus:"SUBMITTED",claimDeadline:"2026-09-28T23:59:59+05:30"},
  {userId:"VE10108",displayId:"VE****08",prizeId:"PRIZE-003",prizeName:"AirPods Pro",giveawayId:"GW-2026-09",status:"WON",claimStatus:"NOT_SUBMITTED",claimDeadline:"2026-09-28T23:59:59+05:30"},
  {userId:"VE10109",displayId:"VE****09",prizeId:"PRIZE-003",prizeName:"AirPods Pro",giveawayId:"GW-2026-09",status:"WON",claimStatus:"PROCESSING",claimDeadline:"2026-09-28T23:59:59+05:30"},
  {userId:"VE10110",displayId:"VE****10",prizeId:"PRIZE-004",prizeName:"₹2,000 Amazon Gift Card",giveawayId:"GW-2026-09",status:"WON",claimStatus:"COMPLETED",claimDeadline:"2026-09-28T23:59:59+05:30"}
];

export const winnerAnnouncements = [
  {id:"ANN-001",displayId:"VE****21",prize:"iPhone 15 Pro",message:"won an iPhone 15 Pro!"},
  {id:"ANN-002",displayId:"VE****83",prize:"Apple Watch",message:"won an Apple Watch!"},
  {id:"ANN-003",displayId:"VE****54",prize:"AirPods Pro",message:"won AirPods Pro!"},
  {id:"ANN-004",displayId:"VE****92",prize:"₹2,000 Amazon Gift Card",message:"won an Amazon Gift Card!"}
];

export const demoUser = {
  id:"VE10025", displayId:"VE****25", isAuthenticated:true,
  balances:{VEs:850,SVEs:1200,Tokens:5000},
  participation:{"GW-2026-09":{joined:true,entries:24,joinedPrizeIds:["PRIZE-002"]}}
};

export const heroIllustrations = {giftBox,giftGlow,ticket};
export const giveawayStats = {totalGiveaways:24,participants:8500,prizesWon:1200};

export const getPrizeBySlug = (slug, giveaway=giveawayCatalog.current) => giveaway.prizes.find(p=>p.slug===slug);
export const getPrizeById = (id, giveaway=giveawayCatalog.current) => giveaway.prizes.find(p=>p.id===id);
export const getUserParticipation = (giveawayId, user=demoUser) => user.participation[giveawayId] || {joined:false,entries:0,joinedPrizeIds:[]};
export const getCurrentUserWinner = (userId=demoUser.id) => currentGiveawayWinners.find(w=>w.userId===userId);

import type {HouseCode,Match,Sport} from './types';
export const EVENT_DATE='2026-08-21';
export const houses:HouseCode[]=['F','E','A','T'];
export const houseMeta={F:{name:'HOUSE F',color:'#F26B5E',soft:'#FDE3DF'},E:{name:'HOUSE E',color:'#74C98B',soft:'#E3F6E8'},A:{name:'HOUSE A',color:'#5BB8E8',soft:'#DFF3FD'},T:{name:'HOUSE T',color:'#F4C84B',soft:'#FFF5CE'}};
export const families=houses.flatMap(h=>Array.from({length:8},(_,i)=>`${h}-${String(i+1).padStart(2,'0')}`));
const slots=[['13:30','13:40'],['13:45','13:55'],['14:00','14:10'],['14:15','14:25'],['14:30','14:40'],['14:45','14:55'],['15:00','15:10'],['15:15','15:25']];
function makeSport(sport:Sport,first:[HouseCode,HouseCode],second:[HouseCode,HouseCode]):Match[]{return slots.flatMap(([startTime,endTime],slot)=>{const pair=slot<4?first:second;const n=slot%4*2+1;return [0,1].map(c=>({id:`${sport}-${startTime.replace(':','')}-c${c+1}`,sport,familyA:`${pair[0]}-${String(n+c).padStart(2,'0')}`,familyB:`${pair[1]}-${String(n+c).padStart(2,'0')}`,houseA:pair[0],houseB:pair[1],court:c+1,startTime,endTime,scoreA:null,scoreB:null,status:'upcoming',version:0}))})}
export const schedule=[...makeSport('badminton',['F','T'],['A','E']),...makeSport('volleyball',['A','E'],['F','T'])];
export const sportLabel=(s:Sport)=>s==='badminton'?'Cầu lông':'Bóng chuyền';

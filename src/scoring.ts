import type {HouseCode,Match,Sport} from './types';
import {houses} from './data';
// Official rules provide no win/ranking-point conversion. Keep this policy isolated.
export function pointsFor(score:number|null){return score??0}
export function houseTotals(matches:Match[]){return houses.map(h=>{const bySport={badminton:0,volleyball:0} as Record<Sport,number>;matches.forEach(m=>{if(m.status!=='completed')return;if(m.houseA===h)bySport[m.sport]+=pointsFor(m.scoreA);if(m.houseB===h)bySport[m.sport]+=pointsFor(m.scoreB)});return {house:h as HouseCode,...bySport,total:bySport.badminton+bySport.volleyball}})}
export function rankedHouses(matches:Match[]){const sorted=houseTotals(matches).sort((a,b)=>b.total-a.total);let rank=0;return sorted.map((x,i)=>{if(i===0||x.total!==sorted[i-1].total)rank=i+1;return {...x,rank,tied:sorted.filter(y=>y.total===x.total).length>1}})}
export function familyTotal(matches:Match[],family:string){return matches.reduce((sum,m)=>sum+(m.status==='completed'?(m.familyA===family?pointsFor(m.scoreA):m.familyB===family?pointsFor(m.scoreB):0):0),0)}

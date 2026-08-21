export type Sport='badminton'|'volleyball';
export type MatchStatus='upcoming'|'live'|'completed';
export type HouseCode='F'|'E'|'A'|'T';
export interface Match {id:string;sport:Sport;familyA:string;familyB:string;houseA:HouseCode;houseB:HouseCode;court:number;startTime:string;endTime:string;scoreA:number|null;scoreB:number|null;status:MatchStatus;version:number;updatedBy?:string;updatedAt?:unknown}
export interface AppUser {uid?:string;email:string;displayName?:string;role:'admin'|'teacher';active:boolean;createdAt?:unknown}
export interface AuditLog {id:string;matchId:string;sport:Sport;matchLabel:string;previousValue:{scoreA:number|null;scoreB:number|null;status:MatchStatus};newValue:{scoreA:number;scoreB:number;status:MatchStatus};teacher:string;timestamp?:unknown}

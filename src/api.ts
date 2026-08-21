import type{Match,MatchStatus,Sport}from'./types';
export const apiConfigured=Boolean(import.meta.env.VITE_APPS_SCRIPT_URL);
const API_URL=import.meta.env.VITE_APPS_SCRIPT_URL??'';
const TIMEOUT_MS=12000;
export class ApiError extends Error{code:string;constructor(message:string,code='API_ERROR'){super(message);this.code=code}}
async function request<T>(payload?:Record<string,unknown>):Promise<T>{if(!apiConfigured)throw new ApiError('Chưa cấu hình địa chỉ Google Apps Script.','NOT_CONFIGURED');const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),TIMEOUT_MS);try{const response=payload?await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),signal:controller.signal}):await fetch(`${API_URL}?action=matches&t=${Date.now()}`,{signal:controller.signal,cache:'no-store'});if(!response.ok)throw new ApiError(`Máy chủ trả về lỗi ${response.status}.`,'HTTP_ERROR');const json=await response.json();if(!json||typeof json.success!=='boolean')throw new ApiError('Phản hồi máy chủ không hợp lệ.','BAD_RESPONSE');if(!json.success)throw new ApiError(json.message||'Yêu cầu thất bại.',json.code);return json.data as T}catch(error){if(error instanceof ApiError)throw error;if((error as Error).name==='AbortError')throw new ApiError('Kết nối quá thời gian. Vui lòng thử lại.','TIMEOUT');throw new ApiError('Không thể kết nối Google Sheets. Kiểm tra mạng và thử lại.','NETWORK')}finally{clearTimeout(timer)}}
export const getMatches=()=>request<Match[]>();
export const authenticateTeacher=(teacherName:string,password:string)=>request<{token:string;teacherName:string;expiresAt:number}>({action:'authenticate',teacherName,password});
export const updateMatch=(input:{token:string;matchId:string;version:number;scoreA:number;scoreB:number;status:MatchStatus})=>request<Match>({action:'updateMatch',...input});
export type TeacherSession={token:string;teacherName:string;expiresAt:number};
const SESSION_KEY='lsts-score-session';
export function readSession():TeacherSession|null{try{const raw=sessionStorage.getItem(SESSION_KEY);if(!raw)return null;const session=JSON.parse(raw)as TeacherSession;if(!session.token||!session.teacherName||Date.now()>=session.expiresAt){sessionStorage.removeItem(SESSION_KEY);return null}return session}catch{return null}}
export function writeSession(session:TeacherSession){sessionStorage.setItem(SESSION_KEY,JSON.stringify(session))}
export function clearSession(){sessionStorage.removeItem(SESSION_KEY)}
export function friendlyError(error:unknown){const e=error as ApiError;if(e.code==='CONFLICT')return'Kết quả trận đấu vừa được cập nhật bởi giáo viên khác. Vui lòng kiểm tra lại trước khi lưu.';if(e.code==='UNAUTHORIZED'||e.code==='SESSION_EXPIRED')return'Phiên nhập điểm đã hết hạn. Vui lòng đăng nhập lại.';return e.message||'Đã xảy ra lỗi. Vui lòng thử lại.'}

import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
export interface AuthRequest extends Request { user?: { userId: string, orgId: string } }
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = (req.headers.authorization || '').replace('Bearer ',''); if (!token) return res.status(401).json({error:'Missing token'})
  try{ const p = jwt.verify(token, process.env.JWT_SECRET as string) as any; req.user = { userId: p.userId, orgId: p.orgId }; next() } catch { return res.status(401).json({error:'Invalid token'})}
}


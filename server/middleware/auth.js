import crypto from 'crypto';

const secret = process.env.JWT_SECRET || 'development-only-change-me';

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');

export const createToken = (payload) => {
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const body = encode({ ...payload, iat: Math.floor(Date.now() / 1000) });
  const unsignedToken = `${header}.${body}`;
  const signature = crypto.createHmac('sha256', secret).update(unsignedToken).digest('base64url');
  return `${unsignedToken}.${signature}`;
};

const verifyToken = (token) => {
  const [header, body, signature] = token.split('.');
  if (!header || !body || !signature) return null;

  const unsignedToken = `${header}.${body}`;
  const expectedSignature = crypto.createHmac('sha256', secret).update(unsignedToken).digest('base64url');
  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
};

export const requireAuth = (req, res, next) => {
  const authorization = req.get('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const user = verifyToken(token);

  if (!user?.id || !user?.role) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  req.user = user;
  return next();
};

export const requireRole = (role) => (req, res, next) => {
  if (req.user?.role !== role) {
    return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
  }
  return next();
};

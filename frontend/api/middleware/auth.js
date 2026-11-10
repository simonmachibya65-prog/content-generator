const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');

/**
 * Verify JWT token and attach user to request
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.access_token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await query(
      'SELECT id, email, full_name, plan, ai_credits, ai_credits_used, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!rows[0] || !rows[0].is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Check if user has required plan
 */
function requirePlan(...plans) {
  return (req, res, next) => {
    const planOrder = ['free', 'starter', 'creator_pro', 'business', 'agency', 'enterprise'];
    const userPlanIndex = planOrder.indexOf(req.user.plan);
    const hasAccess = plans.some(p => planOrder.indexOf(p) <= userPlanIndex);

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Plan upgrade required',
        required: plans,
        current: req.user.plan,
        code: 'PLAN_UPGRADE_REQUIRED'
      });
    }
    next();
  };
}

/**
 * Check AI credits
 */
async function requireAICredits(req, res, next) {
  const remaining = req.user.ai_credits - req.user.ai_credits_used;
  if (remaining <= 0) {
    return res.status(403).json({
      error: 'No AI credits remaining. Please upgrade your plan.',
      code: 'NO_AI_CREDITS'
    });
  }
  next();
}

module.exports = { authenticate, requirePlan, requireAICredits };

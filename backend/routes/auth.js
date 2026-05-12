import express from 'express';
import { 
  redirectToDeriv, 
  handleCallback, 
  getUserInfo, 
  logout,
  refreshToken 
} from '../controllers/derivAuth.js';

const router = express.Router();

router.get('/login', redirectToDeriv);
router.get('/callback', handleCallback);
router.get('/user', getUserInfo);
router.post('/logout', logout);
router.post('/refresh', refreshToken);

export default router;
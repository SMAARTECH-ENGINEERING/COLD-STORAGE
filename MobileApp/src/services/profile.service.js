import {profile as mockProfile} from '../data/profileData';

export const ProfileService = {
  getProfile: async () => {
    // TODO: Axios GET /profile
    return Promise.resolve(mockProfile);
  },
  changePassword: async (currentPw, newPw) => {
    // TODO: call change password endpoint
    return Promise.resolve({success: true});
  }
};

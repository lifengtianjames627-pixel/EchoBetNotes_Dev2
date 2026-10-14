import chatDirectory from './chatDirectory.js';
import sendChatMessage from './sendChatMessage.js';
import messageUnread from './messageUnread.js';
import friendRequests from './friendRequests.js';
import notifications from './notifications.js';
import publicProfile from './publicProfile.js';
import searchUsers from './searchUsers.js';
import resolveProfiles from './resolveProfiles.js';
import getEquippedBadges from './getEquippedBadges.js';
import propagateProfile from './propagateProfile.js';
import trackVisit from './trackVisit.js';
import trackGenre from './trackGenre.js';
import homeFeed from './homeFeed.js';
import reviewsBoard from './reviewsBoard.js';
import editReview from './editReview.js';
import voteReview from './voteReview.js';
import moderateContent from './moderateContent.js';
import translateText from './translateText.js';
import resolveAcgTitle from './resolveAcgTitle.js';
import fetchNetease from './fetchNetease.js';
import storeCoverImage from './storeCoverImage.js';
import podcastUpload from './podcastUpload.js';
import publishPodcast from './publishPodcast.js';
import getPodcastAudio from './getPodcastAudio.js';
import uploadRecruitPoster from './uploadRecruitPoster.js';
import publishRecruitPost from './publishRecruitPost.js';
import getRecruitPoster from './getRecruitPoster.js';

export const functionRegistry = {
  chatDirectory,
  sendChatMessage,
  messageUnread,
  friendRequests,
  notifications,
  publicProfile,
  searchUsers,
  resolveProfiles,
  getEquippedBadges,
  propagateProfile,
  trackVisit,
  trackGenre,
  homeFeed,
  reviewsBoard,
  editReview,
  voteReview,
  moderateContent,
  translateText,
  resolveAcgTitle,
  fetchNetease,
  storeCoverImage,
  podcastUpload,
  publishPodcast,
  getPodcastAudio,
  uploadRecruitPoster,
  publishRecruitPost,
  getRecruitPoster,
};

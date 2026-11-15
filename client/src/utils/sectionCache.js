
/**
 * In-memory client cache to eliminate blank loading screens
 * and enable seamless, instantaneous cross-section shift transitions.
 */
const cacheValues = {
  // Student Portal
  studentDashboard: null,
  studentActivity: null,
  resources: null,
  browseResourceFilters: null,
  reservations: null,
  studentProfile: null,

  // Admin Portal
  adminDashboard: null,
  adminUsers: null,
  adminResources: null,
  adminBookings: null,
  adminNotifications: null,
  adminProfile: null,
};
let cacheIdentity = null;
export const sectionCache = new Proxy(cacheValues, {
  get(target, property) {
    const token = localStorage.getItem('token');
    if (token !== cacheIdentity) { Object.keys(target).forEach(key => { target[key] = null; }); cacheIdentity = token; }
    return target[property];
  },
  set(target, property, value) {
    const token = localStorage.getItem('token');
    if (token !== cacheIdentity) { Object.keys(target).forEach(key => { target[key] = null; }); cacheIdentity = token; }
    target[property] = value; return true;
  }
});



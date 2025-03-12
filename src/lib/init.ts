import { startAllCronJobs } from './cronService';

export function initializeServices() {

  startAllCronJobs();
  
  console.log('Server services initialized successfully.');
}
import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import PatientPortalView from '../views/PatientPortalView.vue';
import RegisterView from '../views/RegisterView.vue';
import ForgotCredentialsView from '../views/ForgotCredentialsView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/forgot-credentials',
      name: 'forgot-credentials',
      component: ForgotCredentialsView
    },
    {
      path: '/patient-portal',
      name: 'patient-portal',
      component: PatientPortalView
    }
  ]
})

export default router 
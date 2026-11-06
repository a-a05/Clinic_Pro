<template>
  <div class="split-glass-layout">  
    <div class="bg-overlay"></div>
    <div class="text-section">
      <div class="text-content">
        <h1>Smart Dental Clinic</h1>
        <p>Providing the best dental care with modern technology. Log in to access your dashboard and manage your appointments.</p>
      </div>
    </div>
    <div class="form-section">
      <div class="glass-card">
        
        <div class="logo-container">
          <div class="logo-circle">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtlEBfEMaX68SskK1DA440ThoZ86Tqd3OcDyMHm-yEuw&s=10" alt="clinic logo" class="clinic-logo">
          </div>
        </div>
        
        <h2>Welcome Back</h2>
        <p class="subtitle">Please enter your details to sign in.</p>

        <form @submit.prevent="handleLogin">
          <div class="input-group">
            <label>Username</label>
            <input type="text" v-model="username" placeholder="Enter your username" required :disabled="isLoading">
          </div>

          <div class="input-group">
            <label>Password</label>
            <input type="password" v-model="password" placeholder="Enter your password" required :disabled="isLoading">
          </div>

          <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

          <button type="submit" class="login-btn" :disabled="isLoading">
            {{ isLoading ? 'Authenticating...' : 'Sign In' }}
          </button>
        </form>

        <div class="auth-links">
          <p><router-link to="/forgot-credentials">Forgot Username or Password?</router-link></p>
          <p>Don't have an account yet? <router-link to="/register">Create an account</router-link></p>
        </div>
        
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const router = useRouter();

const handleLogin = async () => {
    if (!username.value || !password.value) {
        return;
    }

    isLoading.value = true;
    errorMessage.value = '';

    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            username: username.value,
            password: password.value
        });

        const { token, user } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        const role = user?.role?.toLowerCase() || '';

        if(role === 'patient') {
            router.push('/patient-portal');
        }else if(role === 'doctor') {
            router.push('/doctor-dashboard');
        }else if(role === 'receptionist') {
            router.push('/reception-dashboard');
        }else if (role === 'administrator') {
            router.push('/admin-dashboard');
        }else {
            router.push('/');
        }
    } catch (error) {
        if (error.response && error.response.data) {
            errorMessage.value = error.response.data.error || error.response.data.message;
        }else {
            errorMessage.value = 'An error occurred while logging in. Please try again';
        }
    } finally {
        isLoading.value = false;
    }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

.split-glass-layout {
  display: flex;
  min-height: 100vh;
  font-family: 'Poppins', sans-serif;
  background-image: url('https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=1920&auto=format&fit=crop');
  background-size: cover;
  background-position: center;
  position: relative;
}

.bg-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(8, 20, 40, 0.65); 
  z-index: 1;
}

.text-section {
  flex: 1.2;
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  padding: 0 5%;
}

.text-content {
  color: #ffffff;
  max-width: 500px;
}

.text-content h1 {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 15px;
  line-height: 1.2;
  text-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.text-content p {
  font-size: 1.1rem;
  font-weight: 300;
  opacity: 0.9;
  line-height: 1.6;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.form-section {
  flex: 1;
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 420px;
  color: #ffffff;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.logo-circle {
  width: 70px;
  height: 70px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.clinic-logo {
  width: 45px;
  height: 45px;
  object-fit: contain;
}

h2 {
  text-align: center;
  margin-bottom: 5px;
  font-size: 24px;
  font-weight: 600;
}

.subtitle {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 30px;
  font-size: 14px;
  font-weight: 300;
}

.input-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 14px;
}

input {
  width: 100%;
  padding: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  box-sizing: border-box;
  font-size: 15px;
  color: #ffffff;
  transition: all 0.3s ease;
}

input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.15);
  border-color: #00f2fe;
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.2);
}

input:disabled {
  background-color: rgba(0, 0, 0, 0.1);
  cursor: not-allowed;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 172, 254, 0.5);
}

.login-btn:disabled {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.5);
  box-shadow: none;
  cursor: not-allowed;
}

.error-msg {
  color: #ff6b6b;
  text-align: center;
  font-size: 14px;
  margin: 15px 0;
  font-weight: 500;
  background-color: rgba(255, 107, 107, 0.15);
  border: 1px solid rgba(255, 107, 107, 0.3);
  padding: 10px;
  border-radius: 8px;
}

.auth-links {
  margin-top: 25px;
  text-align: center;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.auth-links p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
}

.auth-links a {
  color: #00f2fe;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.auth-links a:hover {
  color: #ffffff;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

@media (max-width: 850px) {
  .text-section {
    display: none;
  }
  .form-section {
    padding: 20px;
  }
}
</style>
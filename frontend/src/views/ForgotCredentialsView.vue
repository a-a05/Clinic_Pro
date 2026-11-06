<template>
  <div class="split-glass-layout">
    
    <div class="bg-overlay"></div>

    <!-- القسم الأيسر: النصوص الترحيبية -->
    <div class="text-section">
      <div class="text-content">
        <h1>Account Recovery</h1>
        <p>Regain access to your Smart Dental account. Verify your identity securely and get back to managing your dental health.</p>
      </div>
    </div>

    <!-- القسم الأيمن: البطاقة الزجاجية -->
    <div class="form-section">
      <div class="glass-card">
        
        <div class="logo-container">
          <div class="logo-circle">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtlEBfEMaX68SskK1DA440ThoZ86Tqd3OcDyMHm-yEuw&s=10" alt="clinic logo" class="clinic-logo" />
          </div>
        </div>
        
        <h2>Smart Dental Clinic</h2>
        <p class="subtitle" v-if="step === 0">What do you need help with?</p>
        <p class="subtitle" v-if="step === 1">Account Recovery</p>
        <p class="subtitle" v-if="step === 2">Verify OTP</p>
        <p class="subtitle" v-if="step === 3 && intention === 'password'">Create New Password</p>
        <p class="subtitle" v-if="step === 3 && intention === 'username'">Your Username</p>

        <!-- الخطوة 0: اختيار نوع الاسترجاع -->
        <div v-if="step === 0" class="selection-group">
          <button class="choice-btn" @click="setIntention('username')">
            <span class="icon">👤</span> I forgot my Username
          </button>
          <button class="choice-btn" @click="setIntention('password')">
            <span class="icon">🔒</span> I forgot my Password
          </button>
        </div>

        <!-- الخطوة 1: طلب الـ OTP -->
        <form v-if="step === 1" @submit.prevent="handleRecovery">
          <div class="input-group">
            <label>Email Address</label>
            <input type="email" v-model="identifier" placeholder="Enter your registered email" required :disabled="isLoading"/>
          </div>
          <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
          <p v-if="successMessage" class="success-msg">{{ successMessage }}</p>
          <button type="submit" class="login-btn" :disabled="isLoading">
            {{ isLoading ? 'Sending OTP...' : 'Send OTP Code' }}
          </button>
          <button type="button" class="back-btn" @click="step = 0" :disabled="isLoading">Back to options</button>
        </form>

        <!-- الخطوة 2: التحقق من الـ OTP -->
        <form v-if="step === 2" @submit.prevent="handleVerify">
          <div class="input-group">
            <label>Enter OTP Code</label>
            <input type="text" v-model="otpCode" placeholder="123456" required :disabled="isLoading" maxlength="6" class="otp-input"/>
            <small class="hint-text">Sent to: {{ identifier }}</small>
          </div>
          <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
          <p v-if="successMessage" class="success-msg">{{ successMessage }}</p>
          <button type="submit" class="login-btn" :disabled="isLoading">
            {{ isLoading ? 'Verifying...' : 'Verify OTP' }}
          </button>
          <button type="button" class="back-btn" @click="step = 1" :disabled="isLoading">Back to Email</button>
        </form>

        <!-- الخطوة 3 (مسار أ): عرض اليوزرنيم -->
        <div v-if="step === 3 && intention === 'username'" class="result-section">
          <div v-if="isLoading" class="loading-text">Fetching your username...</div>
          <div v-else>
            <div class="username-display">
              <span class="label">Your Username is:</span>
              <strong>{{ recoveredUsername }}</strong>
            </div>
            <button @click="router.push('/')" class="login-btn mt-3">Proceed to Login</button>
          </div>
          <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
        </div>

        <!-- الخطوة 3 (مسار ب): تغيير الباسوورد -->
        <form v-if="step === 3 && intention === 'password'" @submit.prevent="handleResetPassword">
          <div class="input-group">
            <label>New Password</label>
            <input type="password" v-model="newPassword" placeholder="Enter new password" required :disabled="isLoading"/>
          </div>
          <div class="input-group">
            <label>Confirm Password</label>
            <input type="password" v-model="confirmPassword" placeholder="Confirm new password" required :disabled="isLoading"/>
          </div>
          <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
          <p v-if="successMessage" class="success-msg">{{ successMessage }}</p>
          <button type="submit" class="login-btn" :disabled="isLoading">
            {{ isLoading ? 'Resetting...' : 'Reset Password' }}
          </button>
        </form>

        <!-- رابط الرجوع للـ Login موجود بكل الخطوات -->
        <div class="auth-links" v-if="step !== 3 || (step === 3 && intention === 'password')">
          <p>Remembered your details? <router-link to="/">Login here</router-link></p>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const step = ref(0); 
const intention = ref('');
const identifier = ref('');
const otpCode = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const recoveredUsername = ref('');
const resetToken = ref('');

const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false); 
const router = useRouter();

const setIntention = (type) => {
  intention.value = type;
  errorMessage.value = '';
  step.value = 1;
};

const handleRecovery = async () => {
  if (!identifier.value) return;
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    await axios.post('http://localhost:5000/api/auth/forgot-credentials', {
      identifier: identifier.value
    });
    successMessage.value = 'OTP sent successfully to your email!';
    setTimeout(() => {
      step.value = 2;
      successMessage.value = '';
    }, 1500);
  } catch (error) {
    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.error || error.response.data.message;
    } else {
      errorMessage.value = 'An error occurred. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
};

const handleVerify = async () => {
  if (!otpCode.value) return;
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const response = await axios.post('http://localhost:5000/api/auth/verify-otp', {
      identifier: identifier.value,
      otpCode: otpCode.value
    });
    
    resetToken.value = response.data.resetToken;
    successMessage.value = 'OTP verified! Redirecting...';
    
    setTimeout(() => {
      step.value = 3;
      successMessage.value = '';
      
      if (intention.value === 'username') {
        fetchUsername();
      }
    }, 1500);

  } catch (error) {
    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.error || error.response.data.message;
    } else {
      errorMessage.value = 'Invalid OTP. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
};

const fetchUsername = async () => {
  isLoading.value = true;
  try {
    const response = await axios.post('http://localhost:5000/api/auth/recover-username', {
      resetToken: resetToken.value
    });
    recoveredUsername.value = response.data.username;
  } catch (error) {
    errorMessage.value = 'Failed to fetch username. Token might be expired.';
  } finally {
    isLoading.value = false;
  }
};

const handleResetPassword = async () => {
  if (!newPassword.value || !confirmPassword.value) return;
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match!';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    await axios.post('http://localhost:5000/api/auth/reset-password', {
      resetToken: resetToken.value,
      newPassword: newPassword.value
    });
    successMessage.value = 'Password reset successfully! Redirecting...';
    
    setTimeout(() => {
      router.push('/'); 
    }, 2000);
  } catch (error) {
    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.error || error.response.data.message;
    } else {
      errorMessage.value = 'An error occurred. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
};
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
  padding: 20px;
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
  margin-bottom: 15px;
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

/* تنسيق أزرار اختيار الاسترجاع للزجاج */
.selection-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.choice-btn {
  width: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.choice-btn:hover {
  border-color: #00f2fe;
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 242, 254, 0.15);
}

.choice-btn .icon {
  font-size: 20px;
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

.otp-input {
  text-align: center;
  letter-spacing: 5px;
  font-weight: bold;
  font-size: 18px;
}

.hint-text {
  display: block;
  text-align: center;
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
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

/* تنسيق زر الرجوع للزجاج */
.back-btn {
  width: 100%;
  padding: 12px;
  background-color: transparent;
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.back-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border-color: #ffffff;
}

/* تنسيق عرض اليوزرنيم للزجاج */
.username-display {
  background: rgba(105, 240, 174, 0.15);
  border: 1px solid rgba(105, 240, 174, 0.3);
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  margin-bottom: 20px;
}

.username-display .label {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin-bottom: 5px;
}

.username-display strong {
  color: #69f0ae;
  font-size: 20px;
  letter-spacing: 1px;
}

.mt-3 {
  margin-top: 15px;
}

/* تنسيق رسائل الخطأ والنجاح */
.error-msg {
  color: #ff6b6b;
  text-align: center;
  font-size: 13px;
  margin: 15px 0;
  font-weight: 500;
  background-color: rgba(255, 107, 107, 0.15);
  border: 1px solid rgba(255, 107, 107, 0.3);
  padding: 10px;
  border-radius: 8px;
}

.success-msg {
  color: #69f0ae;
  text-align: center;
  font-size: 13px;
  margin: 15px 0;
  font-weight: 500;
  background-color: rgba(105, 240, 174, 0.15);
  border: 1px solid rgba(105, 240, 174, 0.3);
  padding: 10px;
  border-radius: 8px;
}

.auth-links {
  margin-top: 25px;
  text-align: center;
  font-size: 14px;
}

.auth-links p {
  margin: 8px 0;
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
}
</style>
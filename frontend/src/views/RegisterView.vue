<template>
    <div class="split-glass-layout">
      <div class="bg-overlay"></div>
      <div class="text-section">
        <div class="text-content">
          <h1>Join Smart Dental</h1>
          <p>Create your account today to book appointments easily, track your dental health, and connect with our top specialists.</p>
        </div>
      </div>
      <div class="form-section">
      <div class="glass-card register-card">
        <div class="logo-container">
          <div class="logo-circle">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtlEBfEMaX68SskK1DA440ThoZ86Tqd3OcDyMHm-yEuw&s=10" alt="clinic logo" class="clinic-logo">
          </div>
        </div>

        <h2>Sign Up</h2>
        <p class="subtitle">Create your new account</p>

        <form @submit.prevent="handleRegister">
          <div class="form-row">
            <div class="input-group">
              <label>First Name</label>
              <input type="text" v-model="form.firstName" placeholder="First Name" required :disabled="isLoading">
            </div>
            <div class="input-group">
              <label>Last Name</label>
              <input type="text" v-model="form.lastName" placeholder="Last Name" required :disabled="isLoading">
            </div>
          </div>
          <div class="form-row">
            <div class="input-group">
              <label>Phone Number</label>
              <input type="tel" v-model="form.phoneNo" placeholder="07xxxxxxxx" required :disabled="isLoading">
            </div>
            <div class="input-group">
              <label>Email</label>
              <input type="email" v-model="form.email" placeholder="example@gmail.com" required :disabled="isLoading">
            </div>
          </div>
          <div class="input-group">
            <label>Username</label>
            <input type="text" v-model="form.username" placeholder="Choose a username" required :disabled="isLoading">
          </div>
          <div class="input-group">
            <label>Password</label>
            <input type="password" v-model="form.password" placeholder="Create a password " required :disabled="isLoading">
          </div>

          <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
          <p v-if="successMessage" class="success-msg">{{ successMessage }}</p>

          <button type="submit" class="login-btn" :disabled="isLoading">
            {{ isLoading ? 'Creating Account...' : 'Sign Up' }}
          </button>
        </form>
        <div class="auth-links">
          <p>Already have an account? <router-link to="/">Login</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
    import { ref } from 'vue';
    import axios from 'axios';
    import { useRouter } from 'vue-router';

    const router = useRouter();
    const isLoading = ref(false);
    const errorMessage = ref('');
    const successMessage = ref('');

    const form = ref({
        firstName: '',
        lastName: '',
        phoneNo: '',
        email: '',
        username: '',
        password: ''
    });

    const handleRegister = async () => {
        isLoading.value = true;
        errorMessage.value = '';
        successMessage.value = '';

        try {
            const response = await axios.post('http://localhost:5000/api/auth/register-online', form.value);

            successMessage.value = 'Account created successfully! Redirecting to login...';

            setTimeout(() => {
                try{
                    router.push({name: 'login'});
                }catch(e){
                    window.location.href = '/';
                }
            }, 2000);

        }catch(error){
            if (error.response && error.response.data) {
                errorMessage.value = error.response.data.message || error.response.data.error;
            }else{
                errorMessage.value = 'An error occurred while creating your account. Please try again later.';
            }
        }finally{
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
    top: 0; 
    left: 0; 
    right: 0; 
    bottom: 0;
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
    color: #ffffff;
  }

  .register-card{
    max-width: 500px;
  }
  
  .logo-container {
    display: flex;
    justify-content: center;
    margin-bottom: 15px;
  }

  .logo-circle {
    width: 80px;
    height: 80px;
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }

  .clinic-logo {
    width: 40px;
    height: 40px;
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
    margin-bottom: 25px;
    font-size: 14px;
    font-weight: 300;
  }

  .form-row {
    display: flex;
    gap: 15px;
  }

  .form-row .input-group {
    flex: 1;
  }

  .input-group {
    margin-bottom: 15px;
  }

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    font-size: 13px;
  }

  input {
    width: 100%;
    padding: 12px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    box-sizing: border-box;
    font-size: 14px;
    color: #ffffff;
    transition: all 0.3s ease;
  }

  input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  input:focus{
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
    background: linear-gradient(135deg, #00f2f2 0%, #4facfe 100%);
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
    margin-top: 20px;
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
    .text.section {
      display: none;
    }

    .form-row {
      flex-direction: column;
      gap: 0;
    }
  }
</style>
<template>
  <div class="portal-layout" dir="rtl">
    <!-- إضاءة خلفية هادئة بديلة عن الصورة لإبراز التأثير الزجاجي -->
    <div class="ambient-glow glow-1"></div>
    <div class="ambient-glow glow-2"></div>

    <!-- القائمة الجانبية (Sidebar) -->
    <aside class="glass-sidebar">
      <div class="brand-header">
        <div class="logo-circle">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtlEBfEMaX68SskK1DA440ThoZ86Tqd3OcDyMHm-yEuw&s=10"
            alt="clinic logo"
            class="clinic-logo"
          />
        </div>
        <div class="brand-text">
          <h2>Smart Dental</h2>
          <span>بوابة المريض الذكية</span>
        </div>
      </div>

      <nav class="nav-menu">
        <button
          class="nav-item"
          :class="{ active: activeTab === 'chat' }"
          @click="activeTab = 'chat'"
        >
          <span class="nav-icon">🤖</span>
          <span>الحجز الذكي (AI)</span>
        </button>

        <button
          class="nav-item"
          :class="{ active: activeTab === 'appointments' }"
          @click="switchTab('appointments')"
        >
          <span class="nav-icon">📅</span>
          <span>مواعيدي القادمة</span>
        </button>

        <button
          class="nav-item"
          :class="{ active: activeTab === 'records' }"
          @click="switchTab('records')"
        >
          <span class="nav-icon">🦷</span>
          <span>سجلاتي الطبية</span>
        </button>

        <button
          class="nav-item"
          :class="{ active: activeTab === 'invoices' }"
          @click="switchTab('invoices')"
        >
          <span class="nav-icon">💳</span>
          <span>الفواتير</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="user-greeting">
          <div class="avatar-badge">👤</div>
          <div class="user-info">
            <span class="welcome-label">أهلاً بك،</span>
            <strong class="username-text">{{ displayUsername }}</strong>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout">
          تسجيل خروج
        </button>
      </div>
    </aside>

    <!-- المحتوى الرئيسي -->
    <main class="main-workspace">
      <!-- التبويب الأول: المساعد الذكي لعيادة الأسنان -->
      <section v-if="activeTab === 'chat'" class="glass-panel chat-container">
        <header class="panel-header">
          <div>
            <h1>المساعد الذكي لعيادة الأسنان</h1>
            <p class="header-subtitle">
              احجز موعدك مباشرة بالمحادثة الطبيعية بدون تعبئة نماذج تقليدية
            </p>
          </div>
          <span class="status-badge">متصل الآن</span>
        </header>

        <!-- صندوق الرسائل -->
        <div class="messages-area" ref="messagesContainer">
          <!-- رسالة الترحيب الافتراضية -->
          <div class="message-wrapper bot-wrapper">
            <div class="bot-avatar">🤖</div>
            <div class="message-bubble bot-bubble">
              مرحباً بك في عيادة Smart Dental. أنا المساعد الذكي، لست بحاجة لتعبئة أي نماذج، فقط أخبرني بما تشعر وكيف يمكنني مساعدتك اليوم؟
            </div>
          </div>

          <!-- سجل الرسائل التفاعلي -->
          <div
            v-for="(msg, index) in chatMessages"
            :key="index"
            class="message-wrapper"
            :class="msg.sender === 'user' ? 'user-wrapper' : 'bot-wrapper'"
          >
            <div v-if="msg.sender === 'bot'" class="bot-avatar">🤖</div>
            <div
              class="message-bubble"
              :class="msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'"
            >
              <p class="msg-text">{{ msg.text }}</p>
              <div v-if="msg.isConfirmed" class="booking-confirmed-badge">
                ✅ تم تأكيد حجزك بنجاح!
              </div>
            </div>
          </div>

          <!-- مؤشر الكتابة -->
          <div v-if="isSending" class="message-wrapper bot-wrapper">
            <div class="bot-avatar">🤖</div>
            <div class="message-bubble bot-bubble typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <p v-if="chatError" class="error-msg">{{ chatError }}</p>

        <!-- شريط الإدخال السفلي -->
        <form class="chat-input-bar" @submit.prevent="sendMessage">
          <input
            type="text"
            v-model="userInput"
            placeholder="اكتب رسالتك هنا ....."
            :disabled="isSending"
          />
          <button type="submit" class="send-btn" :disabled="isSending || !userInput.trim()">
            {{ isSending ? 'جاري الإرسال...' : 'إرسال +' }}
          </button>
        </form>
      </section>

      <!-- التبويب الثاني: مواعيدي القادمة -->
      <section v-else-if="activeTab === 'appointments'" class="glass-panel data-panel">
        <header class="panel-header">
          <div>
            <h1>مواعيدي القادمة</h1>
            <p class="header-subtitle">جدول المواعيد المحجوزة الخاصة بك وحالتها</p>
          </div>
          <button class="action-btn" @click="activeTab = 'chat'">+ حجز موعد جديد</button>
        </header>

        <div v-if="isLoadingData" class="empty-state">جاري تحميل المواعيد...</div>
        <div v-else-if="appointments.length === 0" class="empty-state">
          لا توجد مواعيد قادمة مسجلة حالياً. يمكنك حجز موعد فوراً عبر المساعد الذكي!
        </div>
        <div v-else class="table-wrapper">
          <table class="glass-table">
            <thead>
              <tr>
                <th>رقم الموعد</th>
                <th>التاريخ</th>
                <th>الوقت</th>
                <th>الطبيب المعالج</th>
                <th>سبب الزيارة</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="app in appointments" :key="app.appointmentid">
                <td>#{{ app.appointmentid }}</td>
                <td>{{ formatDate(app.appointmentdate) }}</td>
                <td>{{ formatTime(app.startsat) }}</td>
                <td>{{ app.doctorname || 'د. أحمد' }}</td>
                <td>{{ app.reason }}</td>
                <td>
                  <span class="status-pill" :class="app.appointmentstatus?.toLowerCase()">
                    {{ app.appointmentstatus }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- التبويب الثالث: سجلاتي الطبية -->
      <section v-else-if="activeTab === 'records'" class="glass-panel data-panel">
        <header class="panel-header">
          <div>
            <h1>سجلاتي الطبية والخطط العلاجية</h1>
            <p class="header-subtitle">الاطلاع على الخطط العلاجية المعتمدة والإجراءات الطبية</p>
          </div>
        </header>

        <div v-if="isLoadingData" class="empty-state">جاري تحميل السجلات الطبية...</div>
        <div v-else-if="treatmentPlans.length === 0" class="empty-state">
          لا توجد خطط علاجية مسجلة في ملفك الطبي حتى الآن.
        </div>
        <div v-else class="plans-grid">
          <div v-for="plan in treatmentPlans" :key="plan.treatmentplanid" class="plan-card">
            <div class="plan-card-header">
              <h3>{{ plan.planname }}</h3>
              <span class="status-pill">{{ plan.planstatus }}</span>
            </div>
            <ul class="plan-items-list">
              <li v-for="item in plan.items" :key="item.planItemId">
                <span>{{ item.procedureName }} (السن: {{ item.toothNumber || '-' }})</span>
                <strong>${{ item.estimatedCost }}</strong>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- التبويب الرابع: الفواتير -->
      <section v-else-if="activeTab === 'invoices'" class="glass-panel data-panel">
        <header class="panel-header">
          <div>
            <h1>الفواتير والمبالغ المستحقة</h1>
            <p class="header-subtitle">متابعة الفواتير الشخصية والدفعات المسجلة</p>
          </div>
        </header>

        <div v-if="isLoadingData" class="empty-state">جاري تحميل الفواتير...</div>
        <div v-else-if="invoices.length === 0" class="empty-state">
          لا توجد فواتير مصدرة لحسابك حالياً.
        </div>
        <div v-else class="table-wrapper">
          <table class="glass-table">
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>تاريخ الإصدار</th>
                <th>المبلغ الكلي</th>
                <th>المدفوع</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in invoices" :key="inv.invoiceid">
                <td>{{ inv.invoicenumber }}</td>
                <td>{{ formatDate(inv.issuedat) }}</td>
                <td>${{ inv.totalamount }}</td>
                <td>${{ inv.amountpaid }}</td>
                <td>
                  <span class="status-pill" :class="inv.invoicestatus?.toLowerCase()">
                    {{ inv.invoicestatus }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const activeTab = ref('chat');

// بيانات المستخدم المسجل دخول من الـ LocalStorage
const currentUser = ref(null);
const token = ref('');

// متغيرات الشات الذكي
const userInput = ref('');
const isSending = ref(false);
const chatError = ref('');
const chatMessages = ref([]);
const geminiHistory = ref([]);
const messagesContainer = ref(null);

// متغيرات التبويبات الأخرى
const isLoadingData = ref(false);
const appointments = ref([]);
const treatmentPlans = ref([]);
const invoices = ref([]);

const displayUsername = computed(() => {
  return currentUser.value?.username || 'زائر';
});

onMounted(() => {
  const savedUser = localStorage.getItem('user');
  const savedToken = localStorage.getItem('token');

  if (savedUser) {
    try {
      currentUser.value = JSON.parse(savedUser);
    } catch (e) {
      currentUser.value = null;
    }
  }
  if (savedToken) {
    token.value = savedToken;
  }
});

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const sendMessage = async () => {
  const text = userInput.value.trim();
  if (!text || isSending.value) return;

  chatError.value = '';
  chatMessages.value.push({
    sender: 'user',
    text: text
  });

  userInput.value = '';
  isSending.value = true;
  await scrollToBottom();

  try {
    const response = await axios.post('http://localhost:5000/api/chat', {
      userId: currentUser.value?.userId || null,
      history: geminiHistory.value,
      message: text
    });

    const replyText = response.data.reply;

    // فحص ما إذا كان الرد يتضمن تأكيد حجز لإظهار الشارة الخضراء
    const isBooked =
      replyText.includes('تم تثبيت') ||
      replyText.includes('تم تأكيد') ||
      replyText.includes('بنجاح');

    chatMessages.value.push({
      sender: 'bot',
      text: replyText,
      isConfirmed: isBooked
    });

    // تحديث الـ History بالصيغة المعتمدة لـ Gemini API
    geminiHistory.value.push(
      { role: 'user', parts: [{ text: text }] },
      { role: 'model', parts: [{ text: replyText }] }
    );
  } catch (error) {
    chatError.value =
      error.response?.data?.error || 'حدث خطأ أثناء الاتصال بالمساعد الذكي، يرجى المحاولة مرة أخرى.';
  } finally {
    isSending.value = false;
    await scrollToBottom();
  }
};

const switchTab = async (tabName) => {
  activeTab.value = tabName;
  if (!token.value) return;

  isLoadingData.value = true;
  const authHeaders = { headers: { Authorization: `Bearer ${token.value}` } };

  try {
    if (tabName === 'appointments') {
      const res = await axios.get('http://localhost:5000/api/appointments', authHeaders);
      appointments.value = res.data || [];
    } else if (tabName === 'records' && currentUser.value?.userId) {
      const res = await axios.get(
        `http://localhost:5000/api/treatments/patient/${currentUser.value.userId}`,
        authHeaders
      );
      treatmentPlans.value = res.data?.plans || [];
    } else if (tabName === 'invoices') {
      const res = await axios.get('http://localhost:5000/api/invoices', authHeaders);
      invoices.value = res.data?.invoices || [];
    }
  } catch (err) {
    console.error('Error fetching tab data:', err);
  } finally {
    isLoadingData.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ar-JO');
};

const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  return new Date(timeStr).toLocaleTimeString('ar-JO', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/');
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');

.portal-layout {
  display: flex;
  min-height: 100vh;
  font-family: 'Cairo', 'Poppins', sans-serif;
  background: linear-gradient(135deg, #081428 0%, #0d2240 50%, #050d1a 100%);
  color: #ffffff;
  position: relative;
  overflow: hidden;
  padding: 24px;
  gap: 24px;
  box-sizing: border-box;
}

/* إضاءة خلفية ناعمة تعزز المظهر الزجاجي بدون تشويش الصورة */
.ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(110px);
  z-index: 0;
  pointer-events: none;
}

.glow-1 {
  width: 420px;
  height: 420px;
  background: rgba(0, 242, 254, 0.12);
  top: -80px;
  right: -80px;
}

.glow-2 {
  width: 380px;
  height: 380px;
  background: rgba(79, 172, 254, 0.1);
  bottom: -60px;
  left: -60px;
}

/* القائمة الجانبية الزجاجية */
.glass-sidebar {
  width: 280px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 2;
  flex-shrink: 0;
}

.brand-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.logo-circle {
  width: 54px;
  height: 54px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.clinic-logo {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.brand-text h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.brand-text span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 28px;
  flex: 1;
}

.nav-item {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.85);
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: right;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(0, 242, 254, 0.4);
  transform: translateX(-3px);
}

.nav-item.active {
  background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.35);
}

.nav-icon {
  font-size: 18px;
}

.sidebar-footer {
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.user-greeting {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.06);
  padding: 12px;
  border-radius: 12px;
}

.avatar-badge {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(0, 242, 254, 0.2);
  border: 1px solid rgba(0, 242, 254, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.welcome-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.username-text {
  font-size: 14px;
  color: #00f2fe;
}

.logout-btn {
  width: 100%;
  padding: 12px;
  background: rgba(255, 107, 107, 0.15);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.35);
  border-radius: 10px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: rgba(255, 107, 107, 0.28);
  color: #ffffff;
}

/* مساحة العمل الرئيسية */
.main-workspace {
  flex: 1;
  z-index: 2;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px);
}

.glass-panel {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.panel-header h1 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 700;
}

.header-subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
}

.status-badge {
  background: rgba(105, 240, 174, 0.15);
  color: #69f0ae;
  border: 1px solid rgba(105, 240, 174, 0.35);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

/* منطقة رسائل الشات */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px 8px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.message-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  max-width: 78%;
}

.bot-wrapper {
  align-self: flex-start;
}

.user-wrapper {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.bot-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.message-bubble {
  padding: 16px 20px;
  border-radius: 18px;
  line-height: 1.65;
  font-size: 15px;
}

.bot-bubble {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #ffffff;
  border-bottom-right-radius: 4px;
}

.user-bubble {
  background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
  color: #ffffff;
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
  border-bottom-left-radius: 4px;
}

.msg-text {
  margin: 0;
  white-space: pre-wrap;
}

.booking-confirmed-badge {
  margin-top: 12px;
  background: rgba(105, 240, 174, 0.18);
  border: 1px solid rgba(105, 240, 174, 0.4);
  color: #69f0ae;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
}

/* شريط إدخال الرسالة */
.chat-input-bar {
  display: flex;
  gap: 12px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.chat-input-bar input {
  flex: 1;
  padding: 15px 18px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #ffffff;
  font-family: inherit;
  font-size: 15px;
  transition: all 0.3s ease;
}

.chat-input-bar input::placeholder {
  color: rgba(255, 255, 255, 0.55);
}

.chat-input-bar input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.14);
  border-color: #00f2fe;
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.2);
}

.send-btn {
  padding: 0 28px;
  background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 172, 254, 0.5);
}

.send-btn:disabled {
  background: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.45);
  box-shadow: none;
  cursor: not-allowed;
}

/* مؤشر الكتابة */
.typing-indicator {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 14px 18px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #00f2fe;
  border-radius: 50%;
  animation: bounce 1.3s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* تنسيق الجداول والتبويبات الأخرى */
.table-wrapper {
  margin-top: 20px;
  overflow-x: auto;
}

.glass-table {
  width: 100%;
  border-collapse: collapse;
  text-align: right;
}

.glass-table th,
.glass-table td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-table th {
  color: #00f2fe;
  font-weight: 600;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.04);
}

.status-pill {
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(0, 242, 254, 0.15);
  color: #00f2fe;
  border: 1px solid rgba(0, 242, 254, 0.3);
}

.action-btn {
  padding: 10px 18px;
  background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
}

.empty-state {
  margin: auto;
  text-align: center;
  color: rgba(255, 255, 255, 0.65);
  font-size: 16px;
}

.error-msg {
  color: #ff6b6b;
  text-align: center;
  font-size: 13px;
  margin: 10px 0;
  background-color: rgba(255, 107, 107, 0.15);
  border: 1px solid rgba(255, 107, 107, 0.3);
  padding: 10px;
  border-radius: 8px;
}

@media (max-width: 900px) {
  .portal-layout {
    flex-direction: column;
    padding: 12px;
  }
  .glass-sidebar {
    width: 100%;
    box-sizing: border-box;
  }
  .main-workspace {
    height: auto;
    min-height: 75vh;
  }
}
</style>
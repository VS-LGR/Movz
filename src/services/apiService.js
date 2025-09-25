// Serviço para comunicação com a API
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com/api' 
  : 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.token = null;
  }

  // Configurar token de autenticação
  setToken(token) {
    this.token = token;
  }

  // Remover token
  clearToken() {
    this.token = null;
  }

  // Fazer requisição HTTP
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Adicionar token se disponível
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Retornar a resposta de erro em vez de lançar exceção
        return {
          success: false,
          message: data.message || 'Erro na requisição',
          status: response.status
        };
      }

      return data;
    } catch (error) {
      console.error('Erro na API:', error);
      return {
        success: false,
        message: error.message || 'Erro de conexão',
        status: 0
      };
    }
  }

  // ===== AUTENTICAÇÃO =====
  
  async register(userData) {
    console.log('🔵 apiService.register chamado com:', userData);
    const result = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    console.log('🔵 apiService.register retornou:', result);
    return result;
  }

  async login(email, password, userType = 'STUDENT') {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, userType }),
    });
  }

  async verifyToken() {
    return this.request('/auth/verify');
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getStudentClass() {
    return this.request('/auth/student/class');
  }

  // ===== USUÁRIOS =====

  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(userData) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/users/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async getUserStats() {
    return this.request('/users/stats');
  }

  async addFavoriteSport(sportId) {
    return this.request(`/sports/${sportId}/favorite`, {
      method: 'POST',
    });
  }

  async removeFavoriteSport(sportId) {
    return this.request(`/sports/${sportId}/favorite`, {
      method: 'DELETE',
    });
  }

  async getFavoriteSports() {
    return this.request('/sports/favorites');
  }

  // ===== ESPORTES =====

  async getSports() {
    return this.request('/sports');
  }

  async getSportById(sportId) {
    return this.request(`/sports/${sportId}`);
  }

  async joinSport(sportId) {
    return this.request(`/sports/${sportId}/join`, {
      method: 'POST',
    });
  }

  async leaveSport(sportId) {
    return this.request(`/sports/${sportId}/leave`, {
      method: 'DELETE',
    });
  }

  async getUserSports() {
    return this.request('/sports/user/my-sports');
  }

  async getSportRanking(sportId, limit = 10, offset = 0) {
    return this.request(`/sports/${sportId}/ranking?limit=${limit}&offset=${offset}`);
  }

  // ===== CONTEÚDOS =====

  async getContentsBySport(sportId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    return this.request(`/contents/sport/${sportId}?${params.toString()}`);
  }

  async getContentById(contentId) {
    return this.request(`/contents/${contentId}`);
  }

  async getContentsByType(type, filters = {}) {
    const params = new URLSearchParams();
    if (filters.sportId) params.append('sportId', filters.sportId);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    return this.request(`/contents/type/${type}?${params.toString()}`);
  }

  async getContentProgress(contentId) {
    return this.request(`/contents/${contentId}/progress`);
  }

  async updateContentProgress(contentId, progress) {
    return this.request(`/contents/${contentId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress }),
    });
  }

  async getCompletedContents(limit = 20, offset = 0) {
    return this.request(`/contents/user/completed?limit=${limit}&offset=${offset}`);
  }

  // ===== PONTUAÇÕES =====

  async submitScore(sportId, score, level) {
    return this.request('/scores', {
      method: 'POST',
      body: JSON.stringify({ sportId, score, level }),
    });
  }

  async getUserScores(limit = 20, offset = 0) {
    return this.request(`/scores/user?limit=${limit}&offset=${offset}`);
  }

  async getUserScoreBySport(sportId) {
    return this.request(`/scores/user/${sportId}`);
  }

  async getRanking(filters = {}) {
    const params = new URLSearchParams();
    if (filters.sportId) params.append('sportId', filters.sportId);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    return this.request(`/scores/ranking?${params.toString()}`);
  }

  async getScoreStats() {
    return this.request('/scores/stats');
  }

  async getStudentSportsScores() {
    return this.request('/scores/student/sports');
  }

  // ===== CHAT =====

  async sendMessage(message) {
    return this.request('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getMessages(limit = 50, offset = 0, before = null) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);
    if (before) params.append('before', before);

    return this.request(`/chat/messages?${params.toString()}`);
  }

  async markMessagesAsRead() {
    return this.request('/chat/mark-read', {
      method: 'PUT',
    });
  }

  async getChatStats() {
    return this.request('/chat/stats');
  }

  async deleteMessage(messageId) {
    return this.request(`/chat/${messageId}`, {
      method: 'DELETE',
    });
  }

  // ===== AULAS DE PROFESSOR =====

  async getTeacherClasses(month = null, year = null) {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);

    return this.request(`/classes?${params.toString()}`);
  }

  async createOrUpdateClass(classData) {
    console.log('apiService.createOrUpdateClass chamado com:', classData);
    console.log('Token atual:', this.token);
    return this.request('/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  }

  async deleteClass(classId) {
    return this.request(`/classes/${classId}`, {
      method: 'DELETE',
    });
  }

  async completeClass(classId, isCompleted = true) {
    return this.request(`/classes/${classId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ isCompleted }),
    });
  }

  async getClassStats(month = null, year = null) {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);

    return this.request(`/classes/stats?${params.toString()}`);
  }

  // ===== GERENCIAMENTO DE TURMAS =====

  async getClasses() {
    return this.request('/class-management/classes');
  }

  async createClass(classData) {
    return this.request('/class-management/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  }

  async updateClass(classId, classData) {
    return this.request(`/class-management/classes/${classId}`, {
      method: 'PUT',
      body: JSON.stringify(classData),
    });
  }

  async deleteClass(classId) {
    return this.request(`/class-management/classes/${classId}`, {
      method: 'DELETE',
    });
  }

  async getAvailableStudents(classId = null, search = '') {
    const params = new URLSearchParams();
    if (classId) params.append('classId', classId);
    if (search) params.append('search', search);

    return this.request(`/class-management/students/available?${params.toString()}`);
  }

  async addStudentToClass(classId, studentId) {
    return this.request(`/class-management/classes/${classId}/students`, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    });
  }

  async removeStudentFromClass(classId, studentId) {
    return this.request(`/class-management/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
    });
  }

  async getClassManagementStats() {
    return this.request('/class-management/classes/stats');
  }

  // ===== PONTUAÇÕES DE AULAS =====

  async saveClassScore(classId, studentId, sportId, score, notes = null) {
    return this.request(`/class-management/classes/${classId}/scores`, {
      method: 'POST',
      body: JSON.stringify({ studentId, sportId, score, notes }),
    });
  }

  async getClassScores(classId) {
    return this.request(`/class-management/classes/${classId}/scores`);
  }

  // ===== INSTITUIÇÕES =====

  async registerInstitution(institutionData) {
    return this.request('/institutions/register', {
      method: 'POST',
      body: JSON.stringify(institutionData),
    });
  }

  async loginInstitution(email, password) {
    return this.request('/institutions/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async searchUserByCPF(cpf) {
    return this.request(`/institutions/users/search?cpf=${cpf}`);
  }

  async addUserToInstitution(userId) {
    return this.request(`/institutions/users/${userId}/add`, {
      method: 'POST',
    });
  }

  async removeUserFromInstitution(userId) {
    return this.request(`/institutions/users/${userId}/remove`, {
      method: 'DELETE',
    });
  }

  async getInstitutionUsers(userType = null, search = '') {
    const params = new URLSearchParams();
    if (userType) params.append('userType', userType);
    if (search) params.append('search', search);

    return this.request(`/institutions/users?${params.toString()}`);
  }

  async getInstitutionClasses() {
    return this.request('/institutions/classes');
  }

  async createInstitutionClass(classData) {
    return this.request('/institutions/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  }

  async addStudentToInstitutionClass(classId, studentId) {
    return this.request(`/institutions/classes/${classId}/students`, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    });
  }

  async removeStudentFromInstitutionClass(classId, studentId) {
    return this.request(`/institutions/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
    });
  }

  async deleteInstitutionClass(classId) {
    return this.request(`/institutions/classes/${classId}`, {
      method: 'DELETE',
    });
  }

  async getInstitutionStats() {
    return this.request('/institutions/stats');
  }
}

// Instância singleton
const apiService = new ApiService();

export default apiService;

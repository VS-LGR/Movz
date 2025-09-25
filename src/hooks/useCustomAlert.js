import { useState } from 'react';

const useCustomAlert = () => {
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title, message, type = 'info') => {
    setAlert({
      visible: true,
      title,
      message,
      type
    });
  };

  const hideAlert = () => {
    setAlert(prev => ({
      ...prev,
      visible: false
    }));
  };

  const showSuccess = (title, message) => {
    showAlert(title, message, 'success');
  };

  const showError = (title, message) => {
    showAlert(title, message, 'error');
  };

  const showWarning = (title, message) => {
    showAlert(title, message, 'warning');
  };

  const showInfo = (title, message) => {
    showAlert(title, message, 'info');
  };

  return {
    alert,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default useCustomAlert;

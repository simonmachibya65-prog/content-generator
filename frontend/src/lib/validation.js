// Validation utilities

export const validators = {
  email: (value) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Invalid email address';
    return null;
  },

  password: (value, options = {}) => {
    const { minLength = 8, requireUppercase = true, requireLowercase = true, requireNumber = true, requireSpecial = false } = options;
    
    if (!value) return 'Password is required';
    if (value.length < minLength) return `Password must be at least ${minLength} characters`;
    if (requireUppercase && !/[A-Z]/.test(value)) return 'Password must contain an uppercase letter';
    if (requireLowercase && !/[a-z]/.test(value)) return 'Password must contain a lowercase letter';
    if (requireNumber && !/\d/.test(value)) return 'Password must contain a number';
    if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Password must contain a special character';
    return null;
  },

  required: (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  minLength: (value, min, fieldName = 'This field') => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (value, max, fieldName = 'This field') => {
    if (value && value.length > max) {
      return `${fieldName} must be no more than ${max} characters`;
    }
    return null;
  },

  url: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Invalid URL';
    }
  },

  match: (value, matchValue, fieldName = 'Passwords') => {
    if (value !== matchValue) {
      return `${fieldName} do not match`;
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(value)) return 'Invalid phone number';
    return null;
  },

  number: (value, options = {}) => {
    const { min, max, integer = false } = options;
    const num = Number(value);
    
    if (isNaN(num)) return 'Must be a valid number';
    if (integer && !Number.isInteger(num)) return 'Must be a whole number';
    if (min !== undefined && num < min) return `Must be at least ${min}`;
    if (max !== undefined && num > max) return `Must be no more than ${max}`;
    return null;
  }
};

// Password strength calculator
export const getPasswordStrength = (password) => {
  if (!password) return { strength: 0, label: '', color: 'slate' };
  
  let strength = 0;
  
  // Length
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 15;
  
  // Character variety
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/\d/.test(password)) strength += 15;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 15;
  
  // Determine label and color
  let label, color;
  if (strength < 40) {
    label = 'Weak';
    color = 'red';
  } else if (strength < 70) {
    label = 'Fair';
    color = 'yellow';
  } else if (strength < 90) {
    label = 'Good';
    color = 'blue';
  } else {
    label = 'Strong';
    color = 'green';
  }
  
  return { strength, label, color };
};

// Form validation hook
export const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});

  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return null;

    for (const rule of rules) {
      const error = rule(value, values);
      if (error) return error;
    }
    return null;
  };

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateAll = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(Object.keys(validationRules).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    return isValid;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setValues
  };
};

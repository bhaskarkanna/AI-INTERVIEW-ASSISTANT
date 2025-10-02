import { describe, it, expect, vi } from 'vitest';
import { extractCandidateInfoFallback } from '../services/aiService';

describe('API Fallback Functions', () => {
  it('should extract email from resume text', () => {
    const resumeText = `
      John Doe
      Software Engineer
      Email: john.doe@example.com
      Phone: (555) 123-4567
    `;
    
    const result = extractCandidateInfoFallback(resumeText);
    
    expect(result.email).toBe('john.doe@example.com');
  });

  it('should extract phone number from resume text', () => {
    const resumeText = `
      Jane Smith
      Full Stack Developer
      Contact: jane.smith@company.com
      Phone: +1-555-987-6543
    `;
    
    const result = extractCandidateInfoFallback(resumeText);
    
    expect(result.phone).toBe('+1-555-987-6543');
  });

  it('should extract name from resume text', () => {
    const resumeText = `
      Alice Johnson
      Senior React Developer
      alice.johnson@tech.com
      (555) 456-7890
    `;
    
    const result = extractCandidateInfoFallback(resumeText);
    
    expect(result.name).toBe('Alice Johnson');
  });

  it('should handle missing information gracefully', () => {
    const resumeText = `
      Software Engineer
      React, Node.js, TypeScript
      Experience with modern web development
    `;
    
    const result = extractCandidateInfoFallback(resumeText);
    
    expect(result.name).toBeUndefined();
    expect(result.email).toBeUndefined();
    expect(result.phone).toBeUndefined();
    expect(result.resumeText).toBe(resumeText);
  });

  it('should extract multiple pieces of information', () => {
    const resumeText = `
      Robert Wilson
      Frontend Developer
      Email: robert.wilson@startup.io
      Phone: 555-123-4567
      
      Skills: React, JavaScript, CSS
      Experience: 3 years
    `;
    
    const result = extractCandidateInfoFallback(resumeText);
    
    expect(result.name).toBe('Robert Wilson');
    expect(result.email).toBe('robert.wilson@startup.io');
    expect(result.phone).toBe('555-123-4567');
  });
});


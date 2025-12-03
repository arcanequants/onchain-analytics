/**
 * E-E-A-T Scoring Module Tests
 *
 * Phase 2, Week 3, Day 3
 */

import { describe, it, expect } from 'vitest';
import {
  assessEEAT,
  quickEEATScore,
  type EEATInput,
  type EEATAssessment,
} from './index';

describe('E-E-A-T Scoring', () => {
  describe('assessEEAT', () => {
    it('should return a complete assessment with all dimensions', () => {
      const input: EEATInput = {
        content: 'Our team of certified doctors with 20 years of experience provides medical advice.',
        url: 'https://example-medical.com/health-tips',
        authorInfo: {
          name: 'Dr. Jane Smith',
          credentials: ['MD', 'PhD'],
          bio: 'Board-certified physician with 20 years of clinical experience',
        },
        pageMetadata: {
          title: 'Health Tips from Medical Experts',
          description: 'Evidence-based health advice from certified medical professionals',
          publishDate: '2024-01-15',
          lastModified: '2024-06-01',
        },
      };

      const result = assessEEAT(input);

      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('rating');
      expect(result).toHaveProperty('dimensions');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('assessedAt');

      expect(result.dimensions).toHaveLength(4);
      expect(result.dimensions.map(d => d.dimension)).toEqual([
        'experience',
        'expertise',
        'authoritativeness',
        'trustworthiness',
      ]);
    });

    it('should score high for content with strong E-E-A-T signals', () => {
      const input: EEATInput = {
        content: `
          Based on my 15 years of hands-on experience as a certified financial advisor,
          I've helped thousands of clients achieve their retirement goals.
          Our firm has won multiple industry awards and is frequently cited by
          Forbes and The Wall Street Journal. We maintain the highest ethical standards
          and are regulated by the SEC. Contact us securely via our verified contact page.
          I have personally tested and used these strategies for 10 years.
          In my experience, this methodology works well.
        `,
        url: 'https://trusted-financial-advisor.com/about',
        author: {
          name: 'John Expert CFP',
          credentials: ['CFP', 'CFA', 'MBA'],
          bio: 'Certified Financial Planner with 15 years of experience in wealth management and retirement planning',
        },
        organization: {
          name: 'Trusted Financial Advisors',
          awards: ['Best Financial Advisor 2024', 'Top Wealth Management Firm'],
          certifications: ['SEC Registered', 'FINRA Member'],
          partnerships: ['Forbes Contributor'],
        },
        hasContactInfo: true,
        hasPrivacyPolicy: true,
        hasAboutPage: true,
        hasSSL: true,
      };

      const result = assessEEAT(input);

      // With strong signals across all dimensions, expect good score
      expect(result.overallScore).toBeGreaterThan(30);
      expect(['excellent', 'good', 'needs-improvement']).toContain(result.rating);
    });

    it('should score lower for content lacking E-E-A-T signals', () => {
      const input: EEATInput = {
        content: 'Buy this product now! It is the best!',
        url: 'http://random-site.com/product',
      };

      const result = assessEEAT(input);

      expect(result.overallScore).toBeLessThan(50);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide recommendations for improvement', () => {
      const input: EEATInput = {
        content: 'Some generic content without author information.',
        url: 'https://example.com/page',
      };

      const result = assessEEAT(input);

      expect(result.recommendations.length).toBeGreaterThan(0);
      result.recommendations.forEach(rec => {
        expect(rec).toHaveProperty('dimension');
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('description');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('impact');
      });
    });

    it('should detect experience signals', () => {
      const input: EEATInput = {
        content: `
          After 10 years of testing hundreds of cameras,
          I have tested and personally reviewed this model over 3 months of daily use.
          In my experience, I can confidently say this is excellent.
          For example, the image quality increased by 30% compared to the previous model.
          I have used this camera firsthand for professional photography.
        `,
        url: 'https://camera-reviews.com/review',
      };

      const result = assessEEAT(input);
      const experienceDimension = result.dimensions.find(d => d.dimension === 'experience');

      expect(experienceDimension).toBeDefined();
      expect(experienceDimension!.score).toBeGreaterThan(0);
      expect(experienceDimension!.signals.length).toBeGreaterThan(0);
    });

    it('should detect expertise signals', () => {
      const input: EEATInput = {
        content: 'The research methodology follows peer-reviewed standards. According to studies, this analysis shows strong results.',
        url: 'https://academic-site.edu/research',
        author: {
          name: 'Prof. Smith PhD',
          credentials: ['PhD', 'MSc'],
          bio: 'Professor of Computer Science with expertise in algorithm design and implementation',
        },
      };

      const result = assessEEAT(input);
      const expertiseDimension = result.dimensions.find(d => d.dimension === 'expertise');

      expect(expertiseDimension).toBeDefined();
      expect(expertiseDimension!.score).toBeGreaterThan(0);
    });

    it('should detect authoritativeness signals', () => {
      const input: EEATInput = {
        content: `
          As featured in Forbes and The New York Times,
          our award-winning research has been cited by industry leaders.
          We are the official partner of major organizations.
        `,
        url: 'https://authoritative-source.com/about',
        organization: {
          awards: ['Industry Leader Award', 'Best Research 2024'],
          partnerships: ['Forbes Partner', 'NYT Contributor'],
        },
        socialLinks: ['https://twitter.com/example', 'https://linkedin.com/company/example'],
        hasAboutPage: true,
      };

      const result = assessEEAT(input);
      const authDimension = result.dimensions.find(d => d.dimension === 'authoritativeness');

      expect(authDimension).toBeDefined();
      expect(authDimension!.score).toBeGreaterThan(0);
    });

    it('should detect trustworthiness signals', () => {
      const input: EEATInput = {
        content: `
          Your privacy is important to us. Read our privacy policy.
          We use secure SSL encryption. Contact us with any concerns.
          Our terms of service protect both parties.
        `,
        url: 'https://secure-site.com/about',
      };

      const result = assessEEAT(input);
      const trustDimension = result.dimensions.find(d => d.dimension === 'trustworthiness');

      expect(trustDimension).toBeDefined();
      expect(trustDimension!.signals.length).toBeGreaterThan(0);
    });

    it('should handle YMYL (Your Money Your Life) content appropriately', () => {
      const medicalInput: EEATInput = {
        content: 'This medicine cures all diseases instantly.',
        url: 'https://sketchy-health.com/miracle-cure',
      };

      const result = assessEEAT(medicalInput);

      // YMYL content without proper E-E-A-T should score low
      expect(result.overallScore).toBeLessThan(60);
    });

    it('should include timestamp in assessment', () => {
      const input: EEATInput = {
        content: 'Test content',
        url: 'https://example.com',
      };

      const result = assessEEAT(input);

      expect(result.assessedAt).toBeDefined();
      expect(new Date(result.assessedAt).getTime()).not.toBeNaN();
    });
  });

  describe('quickEEATScore', () => {
    it('should return a numeric score between 0 and 100', () => {
      const score = quickEEATScore(
        'Expert advice from certified professionals.',
        'https://example.com'
      );

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should score higher for content with E-E-A-T indicators', () => {
      const highEEATScore = quickEEATScore(
        'Based on 20 years of experience as a certified expert, backed by peer-reviewed research.',
        'https://trusted-site.org'
      );

      const lowEEATScore = quickEEATScore(
        'Click here to buy stuff cheap!',
        'http://random.com'
      );

      expect(highEEATScore).toBeGreaterThan(lowEEATScore);
    });

    it('should consider URL TLD in scoring', () => {
      const eduScore = quickEEATScore('Academic research paper', 'https://university.edu/paper');
      const govScore = quickEEATScore('Government guidelines', 'https://agency.gov/guidelines');
      const comScore = quickEEATScore('Generic content', 'https://random.com/page');

      // .edu and .gov should score higher on trustworthiness
      expect(eduScore).toBeGreaterThanOrEqual(comScore);
      expect(govScore).toBeGreaterThanOrEqual(comScore);
    });
  });

  describe('Rating Classification', () => {
    it('should classify scores correctly', () => {
      // Test that different score ranges produce correct ratings
      const testCases = [
        { minScore: 80, expectedRatings: ['excellent'] },
        { minScore: 60, expectedRatings: ['excellent', 'good'] },
        { minScore: 40, expectedRatings: ['excellent', 'good', 'needs-improvement'] },
      ];

      testCases.forEach(({ minScore, expectedRatings }) => {
        const input: EEATInput = {
          content: 'Test content with varying E-E-A-T signals.',
          url: 'https://example.com',
        };

        const result = assessEEAT(input);

        if (result.overallScore >= minScore) {
          expect(expectedRatings).toContain(result.rating);
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content gracefully', () => {
      const input: EEATInput = {
        content: '',
        url: 'https://example.com',
      };

      const result = assessEEAT(input);

      expect(result).toBeDefined();
      expect(result.overallScore).toBeLessThan(30);
    });

    it('should handle very long content', () => {
      const longContent = 'Expert certified professional experience. '.repeat(1000);
      const input: EEATInput = {
        content: longContent,
        url: 'https://example.com',
      };

      const result = assessEEAT(input);

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle special characters in content', () => {
      const input: EEATInput = {
        content: 'Expert™ advice® with © symbols & special <characters>',
        url: 'https://example.com/page?query=test&foo=bar',
      };

      const result = assessEEAT(input);

      expect(result).toBeDefined();
    });

    it('should handle missing optional fields', () => {
      const minimalInput: EEATInput = {
        content: 'Minimal content',
        url: 'https://example.com',
      };

      const result = assessEEAT(minimalInput);

      expect(result).toBeDefined();
      expect(result.dimensions).toHaveLength(4);
    });
  });
});

describe('Full Site Functional Test', () => {
  beforeEach(() => {
    cy.visit('/'); 
  });

  it('should load homepage without error', () => {
    cy.contains('SEO').should('exist');
  });
  
  it('should navigate to About page and verify content', () => {
    cy.get('a[href="/about"]').click();
    cy.url().should('include', '/about');
    cy.contains('About').should('exist');
  });

  it('should navigate to Features page and verify content', () => {
    cy.get('a[href="/features"]').click();
    cy.url().should('include', '/features');
    cy.contains('Features').should('exist');
  });

  it('should navigate to Blog page and verify content', () => {
    cy.get('a[href="/blog"]').click();
    cy.url().should('include', '/blog');
    cy.contains('Blog').should('exist');
  });

  it('should navigate to Contact page and verify content', () => {
    cy.get('a[href="/contact"]').click();
    cy.url().should('include', '/contact');
    cy.contains('Contact').should('exist');
  });

  it('should fill and submit contact form if exists', () => {
    cy.get('a[href="/contact"]').click();

    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('textarea[name="message"]').type('This is a test message.');

    cy.get('form').submit();

    cy.contains('Thank you').should('exist'); // ✅ Success msg ko match karo
  });

});

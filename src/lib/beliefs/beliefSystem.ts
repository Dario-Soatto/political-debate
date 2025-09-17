// src/lib/beliefs/beliefSystem.ts
import { BeliefSystem, CoreValue, DomainArea, SpecificIssue } from '@/types/agent';

/**
 * Create a liberal belief system
 */
export function createLiberalBeliefSystem(): BeliefSystem {
  // Core Values - Liberal Perspective
  const coreValues: CoreValue[] = [
    {
      id: 'cv-individual-liberty',
      label: 'Individual Liberty',
      description: 'Personal freedoms should be maximized, especially in personal and social matters, while accepting some economic regulation for the greater good.',
      domainAreaIds: ['da-civil-liberties', 'da-social-policy']
    },
    {
      id: 'cv-collective-welfare',
      label: 'Collective Welfare',
      description: 'Society has a responsibility to ensure the wellbeing of all citizens through government programs and collective action.',
      domainAreaIds: ['da-fiscal-policy', 'da-social-policy', 'da-environmental-policy']
    },
    {
      id: 'cv-equality',
      label: 'Equality',
      description: 'Government should actively work to reduce inequalities and ensure equal opportunities and outcomes for all people.',
      domainAreaIds: ['da-fiscal-policy', 'da-social-policy', 'da-civil-liberties']
    },
    {
      id: 'cv-tradition-authority',
      label: 'Tradition & Authority',
      description: 'Traditional institutions should evolve with the times; authority should be questioned and reformed when it perpetuates injustice.',
      domainAreaIds: ['da-social-policy', 'da-civil-liberties']
    },
    {
      id: 'cv-security-order',
      label: 'Security & Order',
      description: 'Security is important but should not come at the expense of civil liberties or be used to oppress marginalized groups.',
      domainAreaIds: ['da-foreign-policy', 'da-civil-liberties']
    },
    {
      id: 'cv-economic-efficiency',
      label: 'Economic Efficiency',
      description: 'Markets can be efficient but need regulation to prevent exploitation and ensure fair outcomes for workers and consumers.',
      domainAreaIds: ['da-fiscal-policy', 'da-monetary-policy']
    },
    {
      id: 'cv-social-justice',
      label: 'Social Justice',
      description: 'Society must actively address historical injustices and systemic inequalities to create a fair and just world.',
      domainAreaIds: ['da-social-policy', 'da-fiscal-policy', 'da-civil-liberties']
    },
    {
      id: 'cv-national-sovereignty',
      label: 'National Sovereignty',
      description: 'National sovereignty is important but should not prevent international cooperation on global challenges like climate change.',
      domainAreaIds: ['da-foreign-policy', 'da-environmental-policy']
    }
  ];

  // Domain Areas - Liberal Perspective
  const domainAreas: DomainArea[] = [
    {
      id: 'da-fiscal-policy',
      label: 'Fiscal Policy',
      description: 'Government should use progressive taxation and spending to reduce inequality and provide essential services.',
      coreValueIds: ['cv-collective-welfare', 'cv-equality', 'cv-social-justice', 'cv-economic-efficiency'],
      specificIssueIds: ['si-tax-levels', 'si-wealth-redistribution', 'si-healthcare-system', 'si-education-funding', 'si-minimum-wage']
    },
    {
      id: 'da-monetary-policy',
      label: 'Monetary Policy',
      description: 'Monetary policy should prioritize full employment and economic stability, even if it means higher inflation.',
      coreValueIds: ['cv-collective-welfare', 'cv-economic-efficiency'],
      specificIssueIds: ['si-interest-rates', 'si-financial-regulation', 'si-corporate-regulation']
    },
    {
      id: 'da-social-policy',
      label: 'Social Policy',
      description: 'Government should protect marginalized groups and promote progressive social values while respecting diversity.',
      coreValueIds: ['cv-individual-liberty', 'cv-collective-welfare', 'cv-equality', 'cv-tradition-authority', 'cv-social-justice'],
      specificIssueIds: ['si-abortion-rights', 'si-lgbtq-rights', 'si-drug-policy', 'si-religious-freedom', 'si-death-penalty', 'si-criminal-justice']
    },
    {
      id: 'da-foreign-policy',
      label: 'Foreign Policy',
      description: 'America should lead through diplomacy and international cooperation, using military force only as a last resort.',
      coreValueIds: ['cv-security-order', 'cv-national-sovereignty', 'cv-collective-welfare'],
      specificIssueIds: ['si-military-spending', 'si-military-intervention', 'si-international-trade', 'si-foreign-aid', 'si-immigration-policy']
    },
    {
      id: 'da-civil-liberties',
      label: 'Civil Liberties',
      description: 'Civil liberties must be strongly protected, especially for marginalized groups, even at some cost to security.',
      coreValueIds: ['cv-individual-liberty', 'cv-equality', 'cv-tradition-authority', 'cv-security-order', 'cv-social-justice'],
      specificIssueIds: ['si-gun-rights', 'si-surveillance-powers', 'si-free-speech', 'si-religious-freedom']
    },
    {
      id: 'da-environmental-policy',
      label: 'Environmental Policy',
      description: 'Government must take aggressive action on climate change and environmental protection for future generations.',
      coreValueIds: ['cv-collective-welfare', 'cv-national-sovereignty'],
      specificIssueIds: ['si-climate-action', 'si-energy-policy', 'si-environmental-regulation']
    }
  ];

  // Specific Issues - Liberal Perspective
  const specificIssues: SpecificIssue[] = [
    {
      id: 'si-tax-levels',
      label: 'Tax Levels',
      description: 'Taxes should be progressive with higher rates on wealthy individuals and corporations to fund social programs.',
      domainAreaIds: ['da-fiscal-policy']
    },
    {
      id: 'si-wealth-redistribution',
      label: 'Wealth Redistribution',
      description: 'Government should actively redistribute wealth through progressive taxation and social programs to reduce inequality.',
      domainAreaIds: ['da-fiscal-policy']
    },
    {
      id: 'si-healthcare-system',
      label: 'Healthcare System',
      description: 'Healthcare is a human right; government should provide universal coverage through single-payer or public option.',
      domainAreaIds: ['da-fiscal-policy']
    },
    {
      id: 'si-education-funding',
      label: 'Education Funding',
      description: 'Government should significantly increase funding for public education and make college affordable for all.',
      domainAreaIds: ['da-fiscal-policy']
    },
    {
      id: 'si-minimum-wage',
      label: 'Minimum Wage',
      description: 'Minimum wage should be raised to a living wage that allows workers to support themselves and their families.',
      domainAreaIds: ['da-fiscal-policy']
    },
    {
      id: 'si-trade-policy',
      label: 'Trade Policy',
      description: 'Trade deals should include strong labor and environmental protections to prevent exploitation.',
      domainAreaIds: ['da-foreign-policy']
    },
    {
      id: 'si-financial-regulation',
      label: 'Financial Regulation',
      description: 'Strong financial regulation is needed to prevent another financial crisis and protect consumers.',
      domainAreaIds: ['da-monetary-policy']
    },
    {
      id: 'si-interest-rates',
      label: 'Interest Rates',
      description: 'Interest rates should be kept low to promote full employment, even if it risks moderate inflation.',
      domainAreaIds: ['da-monetary-policy']
    },
    {
      id: 'si-corporate-regulation',
      label: 'Corporate Regulation',
      description: 'Corporations need strong oversight to protect workers, consumers, and the environment from exploitation.',
      domainAreaIds: ['da-monetary-policy']
    },
    {
      id: 'si-abortion-rights',
      label: 'Abortion Rights',
      description: 'Women have the right to make their own reproductive choices; abortion should be safe, legal, and accessible.',
      domainAreaIds: ['da-social-policy']
    },
    {
      id: 'si-lgbtq-rights',
      label: 'LGBTQ+ Rights',
      description: 'LGBTQ+ individuals deserve full equality and protection from discrimination in all areas of life.',
      domainAreaIds: ['da-social-policy']
    },
    {
      id: 'si-drug-policy',
      label: 'Drug Policy',
      description: 'Drug addiction should be treated as a health issue, not a criminal one; marijuana should be legalized.',
      domainAreaIds: ['da-social-policy']
    },
    {
      id: 'si-gun-rights',
      label: 'Gun Rights',
      description: 'Common-sense gun regulations are needed to reduce gun violence while respecting Second Amendment rights.',
      domainAreaIds: ['da-civil-liberties']
    },
    {
      id: 'si-religious-freedom',
      label: 'Religious Freedom',
      description: 'Religious freedom is important but cannot be used to discriminate against others or impose beliefs on society.',
      domainAreaIds: ['da-social-policy', 'da-civil-liberties']
    },
    {
      id: 'si-death-penalty',
      label: 'Death Penalty',
      description: 'The death penalty should be abolished as it is inhumane and disproportionately affects minorities.',
      domainAreaIds: ['da-social-policy']
    },
    {
      id: 'si-criminal-justice',
      label: 'Criminal Justice Policy',
      description: 'Criminal justice system needs major reform to address racial bias and focus on rehabilitation over punishment.',
      domainAreaIds: ['da-social-policy']
    },
    {
      id: 'si-surveillance-powers',
      label: 'Surveillance Powers',
      description: 'Government surveillance powers should be limited and subject to strict oversight to protect privacy.',
      domainAreaIds: ['da-civil-liberties']
    },
    {
      id: 'si-free-speech',
      label: 'Free Speech',
      description: 'Free speech is vital but hate speech and misinformation that harm others should face consequences.',
      domainAreaIds: ['da-civil-liberties']
    },
    {
      id: 'si-military-spending',
      label: 'Military Spending',
      description: 'Military spending should be reduced and funds redirected to education, healthcare, and infrastructure.',
      domainAreaIds: ['da-foreign-policy']
    },
    {
      id: 'si-military-intervention',
      label: 'Military Intervention',
      description: 'Military intervention should be rare and only with international support; diplomacy should be the primary tool.',
      domainAreaIds: ['da-foreign-policy']
    },
    {
      id: 'si-international-trade',
      label: 'International Trade',
      description: 'International trade should include strong labor and environmental standards to protect workers globally.',
      domainAreaIds: ['da-foreign-policy']
    },
    {
      id: 'si-foreign-aid',
      label: 'Foreign Aid',
      description: 'Foreign aid should be increased to help developing countries and address global poverty and inequality.',
      domainAreaIds: ['da-foreign-policy']
    },
    {
      id: 'si-immigration-policy',
      label: 'Immigration Policy',
      description: 'Immigration enriches America; we should welcome immigrants with compassionate, inclusive policies.',
      domainAreaIds: ['da-foreign-policy']
    },
    {
      id: 'si-climate-action',
      label: 'Climate Action',
      description: 'Government must take aggressive action to reduce carbon emissions and transition to clean energy.',
      domainAreaIds: ['da-environmental-policy']
    },
    {
      id: 'si-energy-policy',
      label: 'Energy Policy',
      description: 'Government should invest heavily in renewable energy and phase out fossil fuels quickly.',
      domainAreaIds: ['da-environmental-policy']
    },
    {
      id: 'si-environmental-regulation',
      label: 'Environmental Regulation',
      description: 'Strong environmental regulations are needed to protect public health and preserve nature for future generations.',
      domainAreaIds: ['da-environmental-policy']
    }
  ];

  return {
    coreValues,
    domainAreas,
    specificIssues
  };
}

/**
 * Create a conservative belief system
 */
export function createConservativeBeliefSystem(): BeliefSystem {
  // Core Values - Conservative Perspective
  const coreValues: CoreValue[] = [
    {
      id: 'cv-individual-liberty',
      label: 'Individual Liberty',
      description: 'Personal freedom and individual rights are paramount; government should not interfere in people\'s economic choices and personal responsibility.',
      domainAreaIds: ['da-civil-liberties', 'da-fiscal-policy']
    },
    {
      id: 'cv-collective-welfare',
      label: 'Collective Welfare',
      description: 'Society benefits most when individuals are free to pursue their own interests; private charity is better than government welfare.',
      domainAreaIds: ['da-fiscal-policy', 'da-social-policy']
    },
    {
      id: 'cv-equality',
      label: 'Equality',
      description: 'Equality means equal opportunity, not equal outcomes; government should not pick winners and losers through redistribution.',
      domainAreaIds: ['da-fiscal-policy', 'da-civil-liberties']
    },
    {
      id: 'cv-tradition-authority',
      label: 'Tradition & Authority',
      description: 'Traditional institutions and values provide stability and wisdom; they should be preserved and respected.',
      domainAreaIds: ['da-social-policy', 'da-civil-liberties']
    },
    {
      id: 'cv-security-order',
      label: 'Security & Order',
      description: 'Strong national security and law enforcement are essential to protect citizens and maintain social order.',
      domainAreaIds: ['da-foreign-policy', 'da-civil-liberties', 'da-social-policy']
    },
    {
      id: 'cv-economic-efficiency',
      label: 'Economic Efficiency',
      description: 'Free markets are the most efficient way to allocate resources and create prosperity for everyone.',
      domainAreaIds: ['da-fiscal-policy', 'da-monetary-policy']
    },
    {
      id: 'cv-social-justice',
      label: 'Social Justice',
      description: 'True social justice comes from equal opportunity and merit-based outcomes, not government redistribution.',
      domainAreaIds: ['da-social-policy', 'da-fiscal-policy']
    },
    {
      id: 'cv-national-sovereignty',
      label: 'National Sovereignty',
      description: 'America should put its own interests first and not be constrained by international agreements that harm our economy.',
      domainAreaIds: ['da-foreign-policy', 'da-environmental-policy']
    }
  ];

  // Domain Areas - Conservative Perspective
  const domainAreas: DomainArea[] = [
    {
      id: 'da-fiscal-policy',
      label: 'Fiscal Policy',
      description: 'Government should minimize spending and taxes to allow free markets to create prosperity and individual opportunity.',
      coreValueIds: ['cv-individual-liberty', 'cv-collective-welfare', 'cv-equality', 'cv-economic-efficiency', 'cv-social-justice'],
      specificIssueIds: ['si-tax-levels', 'si-wealth-redistribution', 'si-healthcare-system', 'si-education-funding', 'si-minimum-wage']
    },
    {
      id: 'da-monetary-policy',
      label: 'Monetary Policy',
      description: 'Monetary policy should focus on price stability and sound money to protect savers and maintain economic confidence.',
      coreValueIds: ['cv-economic-efficiency', 'cv-individual-liberty'],
      specificIssueIds: ['si-interest-rates', 'si-financial-regulation', 'si-corporate-regulation']
    },
    {
      id: 'da-social-policy',
      label: 'Social Policy',
      description: 'Government should protect traditional values and institutions while allowing local communities to determine their own standards.',
      coreValueIds: ['cv-tradition-authority', 'cv-collective-welfare', 'cv-security-order', 'cv-social-justice'],
      specificIssueIds: ['si-abortion-rights', 'si-lgbtq-rights', 'si-drug-policy', 'si-religious-freedom', 'si-death-penalty', 'si-criminal-justice']
    },
    {
      id: 'da-foreign-policy',
      label: 'Foreign Policy',
      description: 'America should maintain strong defense capabilities and put American interests first in international relations.',
      coreValueIds: ['cv-security-order', 'cv-national-sovereignty'],
      specificIssueIds: ['si-military-spending', 'si-military-intervention', 'si-international-trade', 'si-foreign-aid', 'si-immigration-policy']
    },
    {
      id: 'da-civil-liberties',
      label: 'Civil Liberties',
      description: 'Constitutional rights must be protected, but security and order are also important for protecting freedom.',
      coreValueIds: ['cv-individual-liberty', 'cv-equality', 'cv-tradition-authority', 'cv-security-order'],
      specificIssueIds: ['si-gun-rights', 'si-surveillance-powers', 'si-free-speech', 'si-religious-freedom']
    },
    {
      id: 'da-environmental-policy',
      label: 'Environmental Policy',
      description: 'Environmental protection should not harm economic growth; market solutions and technological innovation are key.',
      coreValueIds: ['cv-economic-efficiency', 'cv-national-sovereignty'],
      specificIssueIds: ['si-climate-action', 'si-energy-policy', 'si-environmental-regulation']
    }
  ];

  // Specific Issues - Conservative Perspective
  const specificIssues: SpecificIssue[] = [
    {
      id: 'si-tax-levels',
      label: 'Tax Levels',
      description: 'Taxes should be low and flat to stimulate economic growth and allow individuals to keep more of their earnings.',
      domainAreaIds: ['da-fiscal-policy']
    },
    {
      id: 'si-wealth-redistribution',
      label: 'Wealth Redistribution',
      description: 'Government redistribution reduces incentives to work and invest; wealth should be earned through merit and effort.',
      domainAreaIds: ['da-fiscal-policy']
    },
    {
      id: 'si-healthcare-system',
      label: 'Healthcare System',
      description: 'Healthcare is best delivered through private markets with competition and consumer choice, not government control.',
      domainAreaIds: ['da-fiscal-policy']
    },
    {
      id: 'si-education-funding',
      label: 'Education Funding',
      description: 'Education should emphasize choice and competition; parents should control education decisions, not government bureaucrats.',
      domainAreaIds: ['da-fiscal-policy']
    },
    {
      id: 'si-minimum-wage',
      label: 'Minimum Wage',
      description: 'Minimum wage laws hurt employment, especially for young and low-skilled workers; wages should be set by market forces.',
      domainAreaIds: ['da-fiscal-policy']
    },
    {
      id: 'si-trade-policy',
      label: 'Trade Policy',
      description: 'Trade deals should prioritize American workers and industries; unfair foreign competition should be countered.',
      domainAreaIds: ['da-foreign-policy']
    },
    {
      id: 'si-financial-regulation',
      label: 'Financial Regulation',
      description: 'Excessive regulation stifles innovation and growth; market discipline is better than government oversight.',
      domainAreaIds: ['da-monetary-policy']
    },
    {
      id: 'si-interest-rates',
      label: 'Interest Rates',
      description: 'Interest rates should reflect market forces and focus on price stability rather than artificial job creation.',
      domainAreaIds: ['da-monetary-policy']
    },
    {
      id: 'si-corporate-regulation',
      label: 'Corporate Regulation',
      description: 'Businesses create jobs and prosperity; excessive regulation drives companies overseas and hurts workers.',
      domainAreaIds: ['da-monetary-policy']
    },
    {
      id: 'si-abortion-rights',
      label: 'Abortion Rights',
      description: 'Life begins at conception and should be protected; abortion should be restricted or banned with exceptions for rare cases.',
      domainAreaIds: ['da-social-policy']
    },
    {
      id: 'si-lgbtq-rights',
      label: 'LGBTQ+ Rights',
      description: 'Traditional marriage and family structures are important; religious freedom must be protected in these matters.',
      domainAreaIds: ['da-social-policy']
    },
    {
      id: 'si-drug-policy',
      label: 'Drug Policy',
      description: 'Drug laws should be enforced to maintain social order; rehabilitation is good but accountability is essential.',
      domainAreaIds: ['da-social-policy']
    },
    {
      id: 'si-gun-rights',
      label: 'Gun Rights',
      description: 'Second Amendment rights are fundamental; law-abiding citizens should not be punished for criminals\' actions.',
      domainAreaIds: ['da-civil-liberties']
    },
    {
      id: 'si-religious-freedom',
      label: 'Religious Freedom',
      description: 'Religious liberty is a foundational right that must be protected from government interference and secular coercion.',
      domainAreaIds: ['da-social-policy', 'da-civil-liberties']
    },
    {
      id: 'si-death-penalty',
      label: 'Death Penalty',
      description: 'Death penalty is appropriate for the most heinous crimes; justice requires proportional punishment.',
      domainAreaIds: ['da-social-policy']
    },
    {
      id: 'si-criminal-justice',
      label: 'Criminal Justice Policy',
      description: 'Criminal justice should focus on punishment and deterrence; victims\' rights are as important as criminals\' rights.',
      domainAreaIds: ['da-social-policy']
    },
    {
      id: 'si-surveillance-powers',
      label: 'Surveillance Powers',
      description: 'Government needs surveillance tools to protect national security; proper oversight can balance security and privacy.',
      domainAreaIds: ['da-civil-liberties']
    },
    {
      id: 'si-free-speech',
      label: 'Free Speech',
      description: 'Free speech must be protected absolutely; censorship of unpopular ideas threatens democracy and freedom.',
      domainAreaIds: ['da-civil-liberties']
    },
    {
      id: 'si-military-spending',
      label: 'Military Spending',
      description: 'Strong defense is essential for national security; military spending protects American interests and allies.',
      domainAreaIds: ['da-foreign-policy']
    },
    {
      id: 'si-military-intervention',
      label: 'Military Intervention',
      description: 'America should use military force when necessary to protect national interests and maintain global stability.',
      domainAreaIds: ['da-foreign-policy']
    },
    {
      id: 'si-international-trade',
      label: 'International Trade',
      description: 'Trade should be fair and reciprocal; America should not accept unfair deals that hurt American workers.',
      domainAreaIds: ['da-foreign-policy']
    },
    {
      id: 'si-foreign-aid',
      label: 'Foreign Aid',
      description: 'Foreign aid should serve American interests and be limited; domestic needs should come first.',
      domainAreaIds: ['da-foreign-policy']
    },
    {
      id: 'si-immigration-policy',
      label: 'Immigration Policy',
      description: 'Immigration should be legal and controlled; border security is essential to protect sovereignty and security.',
      domainAreaIds: ['da-foreign-policy']
    },
    {
      id: 'si-climate-action',
      label: 'Climate Action',
      description: 'Climate policies should not harm the economy; technological innovation and adaptation are better than regulation.',
      domainAreaIds: ['da-environmental-policy']
    },
    {
      id: 'si-energy-policy',
      label: 'Energy Policy',
      description: 'Energy independence is crucial; all energy sources should compete fairly without government picking winners.',
      domainAreaIds: ['da-environmental-policy']
    },
    {
      id: 'si-environmental-regulation',
      label: 'Environmental Regulation',
      description: 'Environmental protection is important but should not destroy jobs or harm economic competitiveness.',
      domainAreaIds: ['da-environmental-policy']
    }
  ];

  return {
    coreValues,
    domainAreas,
    specificIssues
  };
}

/**
 * Helper functions to navigate belief systems
 */
export function findBeliefById<T extends { id: string }>(beliefs: T[], id: string): T | undefined {
  return beliefs.find(belief => belief.id === id);
}

export function getConnectedBeliefs(): {
  coreValues: CoreValue[];
  domainAreas: DomainArea[];
  specificIssues: SpecificIssue[];
} {
  // This function will find all beliefs connected to a given belief
  // Implementation depends on the type of belief and direction of connection
  // For now, return empty arrays - we'll implement this in the next phase
  return {
    coreValues: [],
    domainAreas: [],
    specificIssues: []
  };
}

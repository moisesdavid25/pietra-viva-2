import React from 'react';

// Feature Components
import { HomeHero } from './HomeComponents/HomeHero';
import { HomeSuccess } from './HomeComponents/HomeSuccess';
import { HomeBenefits } from './HomeComponents/HomeBenefits';
import { HomeSteps } from './HomeComponents/HomeSteps';
import { HomeRoiCalculator } from './HomeComponents/HomeRoiCalculator';
import { HomePricing } from './HomeComponents/HomePricing';

export default function Home() {
  return (
    <>
      <HomeHero />
      <HomeSuccess />
      <HomeBenefits />
      <HomeSteps />
      <HomeRoiCalculator />
      <HomePricing />
    </>
  );
}

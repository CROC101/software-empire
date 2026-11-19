import { Suspense } from 'react';
import { CheckoutClient } from './CheckoutClient';

export const dynamicParams = false;

export function generateStaticParams() {
  // Orders live in the browser, so one static page reads ?order=...
  return [{ orderId: 'pay' }];
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutClient />
    </Suspense>
  );
}

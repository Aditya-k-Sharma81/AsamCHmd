import { redirect } from 'next/navigation';

export default function UserOrdersIndex() {
  redirect('/orders/history');
}

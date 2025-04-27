import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { PaymentInfo } from './paymentInfoCard';
import { useActiveAccount } from 'thirdweb/react';
import { PaymentRequestCard } from './PaymentRequestCard';



export default function PaymentsScreenRequest() {
  const [payments, setPayments] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const account = useActiveAccount();

  useEffect(() => {
    if (!account) return;
    fetchPayments(account.address, page);
  }, [page]);

  const fetchPayments = async (userId: string, pageNum: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://www.ioplasmaverse.com/api/pay/getPaymentRequest/${userId.toLowerCase()}?page=${pageNum}`);
      if (!response.ok) {
        const text = await response.text();
        console.error(`Fetch failed - Status: ${response.status}, Body: ${text}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error(`Expected JSON, got Content-Type: ${contentType}, Body: ${text}`);
        throw new Error('Response is not JSON');
      }
      const data = await response.json();
      // Log the response for debugging
      console.log('Fetched data:', data);
      // Ensure notifications is an array before updating state
      if (Array.isArray(data.paymentRequest)) {
        setPayments((prev) => (pageNum === 1 ? data.paymentRequest : [...prev, ...data.paymentRequest]));
      } else {
        console.error('Expected notifications to be an array, got:', data.paymentRequest);
        // Optionally set to empty array to avoid breaking the UI
        setPayments((prev) => (pageNum === 1 ? [] : prev));
      }
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {payments.map((item) => (
        <Animated.View
          key={item.payment_id}
          entering={FadeIn.duration(500)}
          style={styles.paymentItem}
        >
          <PaymentRequestCard inAppPay={item.in_app_payment} userId={item.user_id} recieverAddress={item.reciever_address} message={item.message} id={item.payment_id} amount={item.amount} date={new Date(item.created_at).toLocaleDateString()} status={item.is_payed} transactionHash={item.transaction_hash} chainId={Number(item.chain_id)} token={item.token_address.toString()} />
         
         
        </Animated.View>
      ))}
      {hasMore && (
        <TouchableOpacity onPress={() => setPage((prev) => prev + 1)}>
          <Text style={styles.loadMore}>Load More</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  paymentItem: { padding: 10, borderBottomWidth: 1, borderColor: '#ccc' },
  loadMore: { textAlign: 'center', padding: 10, color: 'blue' },
});
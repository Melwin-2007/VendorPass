import os

def update_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")

# 1. index.tsx
index_replacements = [
    ("import { router, useLocalSearchParams } from 'expo-router';", "import { router, useLocalSearchParams } from 'expo-router';\nimport Toast from 'react-native-toast-message';"),
    ("const [toastMessage, setToastMessage] = useState<string | null>(null);", ""),
    ("""  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };""", """  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    Toast.show({
      type: type,
      text1: message,
      position: 'top',
    });
  };"""),
    ("""      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}""", ""),
    ("showToast('❌ You have an active or pending loan. Please pay it off first.')", "showToast('Active Loan Detected. Repayment required before new applications.', 'error')"),
    ("showToast('❌ Please enter a valid amount')", "showToast('Invalid Amount. Please enter a valid numerical value.', 'error')"),
    ("showToast('❌ Failed to send proposal.')", "showToast('Submission Failed. Unable to process loan proposal.', 'error')"),
    ("showToast(`✅ Proposal sent to ${lenderName}!`)", "showToast(`Proposal Submitted. Awaiting review from ${lenderName}.`, 'success')"),
    ("showToast(`🔗 Linked to ${supplierName} successfully!`)", "showToast(`Supplier Linked. ${supplierName} added to your network.`, 'success')"),
    ("showToast('❌ Failed to approve loan.')", "showToast('Approval Failed. Unable to process disbursement.', 'error')"),
    ("showToast('✅ Loan approved & disbursed!')", "showToast('Disbursement Successful. Funds have been deposited.', 'success')"),
    ("showToast('❌ Failed to decline loan.')", "showToast('Action Failed. Unable to process decline request.', 'error')"),
    ("showToast('ℹ️ Loan application declined.')", "showToast('Application Declined. Request has been closed.', 'info')"),
    ("showToast('ℹ️ Notification center opened.')", "showToast('Notifications. Viewing recent alerts.', 'info')"),
    ("showToast('ℹ️ Settings opened.')", "showToast('Settings. Managing account preferences.', 'info')"),
    ("showToast('ℹ️ Apply for new loan limit.')", "showToast('Credit Limit. Initiating limit increase request.', 'info')"),
    ("showToast('ℹ️ Portfolio tracker.')", "showToast('Portfolio. Viewing financial summary.', 'info')"),
    ("showToast('ℹ️ At-Risk loans audit.')", "showToast('Risk Audit. Analyzing portfolio health.', 'info')"),
    ("showToast('Viewing all pending applications.')", "showToast('Applications. Viewing pending requests.', 'info')")
]
update_file(r'c:\Users\HP\Desktop\VendorPass\src\app\(tabs)\index.tsx', index_replacements)

# 2. history.tsx
history_replacements = [
    ("import { router } from 'expo-router';", "import { router } from 'expo-router';\nimport Toast from 'react-native-toast-message';"),
    ("const [toastMessage, setToastMessage] = useState<string | null>(null);", ""),
    ("""  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };""", """  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    Toast.show({
      type: type,
      text1: message,
      position: 'top',
    });
  };"""),
    ("""      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}""", ""),
    ("showToast('❌ Repayment failed')", "showToast('Repayment Failed. Unable to process transaction.', 'error')"),
    ("showToast('❌ Wallet transaction failed (Check Console).')", "showToast('Transaction Error. Ledger update failed.', 'error')"),
    ("showToast('✅ EMI paid successfully!')", "showToast('Payment Successful. EMI has been processed.', 'success')")
]
update_file(r'c:\Users\HP\Desktop\VendorPass\src\app\history.tsx', history_replacements)

# 3. explore.tsx
explore_replacements = [
    ("import { router } from 'expo-router';", "import { router } from 'expo-router';\nimport Toast from 'react-native-toast-message';"),
    ("const [toastMessage, setToastMessage] = useState<string | null>(null);", ""),
    ("""  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };""", """  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    Toast.show({
      type: type,
      text1: message,
      position: 'top',
    });
  };"""),
    ("""      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}""", ""),
    ("showToast('Removed from Watchlist')", "showToast('Watchlist Updated. Profile removed.', 'info')"),
    ("showToast('Added to Watchlist')", "showToast('Watchlist Updated. Profile added.', 'success')"),
    ("showToast('Loan Offer Sent!')", "showToast('Offer Submitted. Pending vendor review.', 'success')"),
    ("showToast(`Opening profile of ${opp.name}`)", "showToast(`Profile. Loading data for ${opp.name}.`, 'info')"),
    ("showToast('Map overlay toggled')", "showToast('Map View. Overlay active.', 'info')"),
    ("showToast('Inbox notification tray')", "showToast('Inbox. Viewing messages.', 'info')"),
    ("showToast('Sorting options')", "showToast('Filters. Sorting options applied.', 'info')"),
    ("showToast('Opening map search grid')", "showToast('Search Grid. Map view opened.', 'info')")
]
update_file(r'c:\Users\HP\Desktop\VendorPass\src\app\(tabs)\explore.tsx', explore_replacements)

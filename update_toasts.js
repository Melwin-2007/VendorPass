const fs = require('fs');

function updateFile(filepath, replacements) {
    let content = fs.readFileSync(filepath, 'utf8');
    
    for (const [oldStr, newStr] of replacements) {
        content = content.split(oldStr).join(newStr);
    }
    
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated ${filepath}`);
}

const indexReplacements = [
    ["import { router, useLocalSearchParams } from 'expo-router';", "import { router, useLocalSearchParams } from 'expo-router';\nimport Toast from 'react-native-toast-message';"],
    ["const [toastMessage, setToastMessage] = useState<string | null>(null);", ""],
    [`  const showToast = (message: string) => {\n    setToastMessage(message);\n    setTimeout(() => {\n      setToastMessage(null);\n    }, 3500);\n  };`, `  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {\n    Toast.show({\n      type: type,\n      text1: message,\n      position: 'top',\n    });\n  };`],
    [`      {toastMessage && (\n        <View style={styles.toastContainer}>\n          <Text style={styles.toastText}>{toastMessage}</Text>\n        </View>\n      )}`, ""],
    ["showToast('❌ You have an active or pending loan. Please pay it off first.')", "showToast('Active Loan Detected. Repayment required before new applications.', 'error')"],
    ["showToast('❌ Please enter a valid amount')", "showToast('Invalid Amount. Please enter a valid numerical value.', 'error')"],
    ["showToast('❌ Failed to send proposal.')", "showToast('Submission Failed. Unable to process loan proposal.', 'error')"],
    ["showToast(`✅ Proposal sent to ${lenderName}!`)", "showToast(`Proposal Submitted. Awaiting review from ${lenderName}.`, 'success')"],
    ["showToast(`🔗 Linked to ${supplierName} successfully!`)", "showToast(`Supplier Linked. ${supplierName} added to your network.`, 'success')"],
    ["showToast('❌ Failed to approve loan.')", "showToast('Approval Failed. Unable to process disbursement.', 'error')"],
    ["showToast('✅ Loan approved & disbursed!')", "showToast('Disbursement Successful. Funds have been deposited.', 'success')"],
    ["showToast('❌ Failed to decline loan.')", "showToast('Action Failed. Unable to process decline request.', 'error')"],
    ["showToast('ℹ️ Loan application declined.')", "showToast('Application Declined. Request has been closed.', 'info')"],
    ["showToast('ℹ️ Notification center opened.')", "showToast('Notifications. Viewing recent alerts.', 'info')"],
    ["showToast('ℹ️ Settings opened.')", "showToast('Settings. Managing account preferences.', 'info')"],
    ["showToast('ℹ️ Apply for new loan limit.')", "showToast('Credit Limit. Initiating limit increase request.', 'info')"],
    ["showToast('ℹ️ Portfolio tracker.')", "showToast('Portfolio. Viewing financial summary.', 'info')"],
    ["showToast('ℹ️ At-Risk loans audit.')", "showToast('Risk Audit. Analyzing portfolio health.', 'info')"],
    ["showToast('Viewing all pending applications.')", "showToast('Applications. Viewing pending requests.', 'info')"]
];

updateFile('c:\\\\Users\\\\HP\\\\Desktop\\\\VendorPass\\\\src\\\\app\\\\(tabs)\\\\index.tsx', indexReplacements);

const historyReplacements = [
    ["import { router } from 'expo-router';", "import { router } from 'expo-router';\nimport Toast from 'react-native-toast-message';"],
    ["const [toastMessage, setToastMessage] = useState<string | null>(null);", ""],
    [`  const showToast = (message: string) => {\n    setToastMessage(message);\n    setTimeout(() => {\n      setToastMessage(null);\n    }, 3000);\n  };`, `  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {\n    Toast.show({\n      type: type,\n      text1: message,\n      position: 'top',\n    });\n  };`],
    [`      {toastMessage && (\n        <View style={styles.toastContainer}>\n          <Text style={styles.toastText}>{toastMessage}</Text>\n        </View>\n      )}`, ""],
    ["showToast('❌ Repayment failed')", "showToast('Repayment Failed. Unable to process transaction.', 'error')"],
    ["showToast('❌ Wallet transaction failed (Check Console).')", "showToast('Transaction Error. Ledger update failed.', 'error')"],
    ["showToast('✅ EMI paid successfully!')", "showToast('Payment Successful. EMI has been processed.', 'success')"]
];

updateFile('c:\\\\Users\\\\HP\\\\Desktop\\\\VendorPass\\\\src\\\\app\\\\history.tsx', historyReplacements);

const exploreReplacements = [
    ["import { router } from 'expo-router';", "import { router } from 'expo-router';\nimport Toast from 'react-native-toast-message';"],
    ["const [toastMessage, setToastMessage] = useState<string | null>(null);", ""],
    [`  const showToast = (message: string) => {\n    setToastMessage(message);\n    setTimeout(() => {\n      setToastMessage(null);\n    }, 3000);\n  };`, `  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {\n    Toast.show({\n      type: type,\n      text1: message,\n      position: 'top',\n    });\n  };`],
    [`      {toastMessage && (\n        <View style={styles.toastContainer}>\n          <Text style={styles.toastText}>{toastMessage}</Text>\n        </View>\n      )}`, ""],
    ["showToast('Removed from Watchlist')", "showToast('Watchlist Updated. Profile removed.', 'info')"],
    ["showToast('Added to Watchlist')", "showToast('Watchlist Updated. Profile added.', 'success')"],
    ["showToast('Loan Offer Sent!')", "showToast('Offer Submitted. Pending vendor review.', 'success')"],
    ["showToast(`Opening profile of ${opp.name}`)", "showToast(`Profile. Loading data for ${opp.name}.`, 'info')"],
    ["showToast('Map overlay toggled')", "showToast('Map View. Overlay active.', 'info')"],
    ["showToast('Inbox notification tray')", "showToast('Inbox. Viewing messages.', 'info')"],
    ["showToast('Sorting options')", "showToast('Filters. Sorting options applied.', 'info')"],
    ["showToast('Opening map search grid')", "showToast('Search Grid. Map view opened.', 'info')"]
];

updateFile('c:\\\\Users\\\\HP\\\\Desktop\\\\VendorPass\\\\src\\\\app\\\\(tabs)\\\\explore.tsx', exploreReplacements);

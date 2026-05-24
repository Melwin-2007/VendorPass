import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { SymbolView } from '@/components/symbol-view';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { LenderBottomTabBar } from '@/components/BottomTabBar';

// -------------------- VENDOR CREDIT HUB SCREEN --------------------
function VendorCreditHubScreen() {
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();

  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    ios: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.five,
      paddingBottom: Spacing.four,
    },
  });

  const loans = [
    {
      id: '1',
      title: 'Daily Micro-Credit',
      amount: '₹1,00,000',
      rate: '0.1% daily interest',
      tenure: '7 to 30 days',
      provider: 'Bharat MicroFinance NBFC',
      tag: 'RECOMMENDED',
    },
    {
      id: '2',
      title: 'Weekly Kirana Stocking Loan',
      amount: '₹10,000 - ₹25,000',
      rate: '1.2% weekly interest',
      tenure: '1 to 3 months',
      provider: 'Saffron Credit Co-op',
      tag: 'POPULAR',
    },
    {
      id: '3',
      title: 'Vendor Upgrade Capital',
      amount: '₹50,000 - ₹1,00,000',
      rate: '14% flat p.a.',
      tenure: '6 to 12 months',
      provider: 'Janata Union Bank',
      tag: 'BEST RATE',
    },
  ];

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <SymbolView tintColor={theme.primary} name="chevron.left" size={20} />
          <Text style={[styles.backText, { color: theme.primary }]}>Back to Dashboard</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Credit Hub</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Compare rates and access personalized loans powered by your behavioral TrustScore™.
        </Text>
      </View>

      {/* Credit Offers Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PERSONALIZED LOANS</Text>
        {loans.map((loan) => (
          <Pressable
            key={loan.id}
            style={({ pressed }) => [
              styles.loanCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                opacity: pressed ? 0.95 : 1.0,
              },
            ]}>
            <View style={styles.loanHeader}>
              <View>
                <Text style={[styles.loanTitle, { color: theme.text }]}>{loan.title}</Text>
                <Text style={[styles.loanProvider, { color: theme.textSecondary }]}>{loan.provider}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: theme.primary + '15' }]}>
                <Text style={[styles.badgeText, { color: theme.primary }]}>{loan.tag}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.loanDetailsRow}>
              <View style={styles.detailCol}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>LIMIT AMOUNT</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{loan.amount}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>INTEREST RATE</Text>
                <Text style={[styles.detailValue, { color: theme.success }]}>{loan.rate}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>TENURE</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{loan.tenure}</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.applyButton,
                { backgroundColor: theme.secondary, opacity: pressed ? 0.9 : 1.0 },
              ]}>
              <Text style={styles.applyButtonText}>Apply Instantly</Text>
              <SymbolView tintColor="#fff" name="chevron.right" size={14} />
            </Pressable>
          </Pressable>
        ))}
      </View>

      {/* Educational Hub */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>FINANCIAL EDUCATION</Text>
        <Pressable
          style={[styles.eduCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '20' }]}>
          <SymbolView tintColor={theme.primary} name="graduationcap" size={28} style={styles.eduIcon} />
          <View style={styles.eduDetails}>
            <Text style={[styles.eduTitle, { color: theme.text }]}>How to grow your TrustScore™</Text>
            <Text style={[styles.eduDesc, { color: theme.textSecondary }]}>
              Learn simple transactions, digital ledger tips, and repayment strategies to boost credit limits.
            </Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// -------------------- LENDER BROWSE SCREEN --------------------
interface Opportunity {
  id: string;
  name: string;
  category: string;
  location: string;
  score: number;
  amount: string;
  tenure: string;
  note: string;
  interest: string;
  image: string;
  avatars: string[];
  funding_status?: string;
}

const defaultOpportunities: Opportunity[] = [
  {
    id: 'opp-1',
    name: "Priya's Organic Mart",
    category: 'Retail',
    location: 'Bengaluru',
    score: 842,
    amount: '₹30,000',
    tenure: '6 months',
    note: 'inventory expansion for the festive season',
    interest: '4 Lenders interested',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlgj-SJy7IHHN72FxR0ksw9nM_XrQpT4CDw_-cf7XWWW3dGev-D7RrwT5t01Jjh9SC4mPC4V72WbitqBuxaang7oo5_1RNOweXOjkLpUEQiI6VM9qNtBGbdtINFD_1tCcctKfd3S9YQXPcSyZOGjFNvmYK-I3Z1kWnVfeBtMZZfSRlX9Ixyo_i322Hmo4RCrCVfMZUl6pIdFZAF7AUYxALh1sSDJykFkLtVia9Fehqnn39siVkTBQ_F8WeSDNBCMApg9u7YLxNIXlV',
    avatars: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA3hLQjdNWbXnIL9iJKiflOBCYQepD67FLny_XMmVvlbMB1INZ9WOVcww8F1O4yV41f5Vj8zm04GtGfxxTE1mAjFWoqtdOF6RTJc0WyDnAWWqPm9jQUcIwNqUL-XnH0TN0cXlwmDsy3EMjKDqBMeYoY6oKSwui1Xnicj61EaQbPSo0gUOifnx5TIcDCQ0GlRoCPmOb67C5r0A6TOnL0GTv_KRoBnCSrvmnb41itPQhebSP-u9C4jgXRvLXXIVMlbFBDWfSqRcqRDSzI',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDzzSuHOpEJn-7xe_AibaeP3BNgyVm1sqY9bXQ5vIYvcq-79NQCh2y_iFSBGk36s3oybmkVsCRLc51jEdrOBqHM5E55whcfLhJqMiK32jyP2wIkyr3jqZ0rDwBbjYxu6IeDiI81XyIwD1nrloftvPQ02rxFV0Qr-0eSMEUYcMaQmUXDwg7sQ-besw5_7gDFh78oFgPGVOUwjNNWBYEH5WYnqwJYKzRUP4bzbta3oOY7dwj7h_8YaJ5zTJA-xv3FC8rhF79eRsCcKXh3'
    ]
  },
  {
    id: 'opp-2',
    name: 'Artisan Ceramics',
    category: 'Crafts',
    location: 'Mysore',
    score: 715,
    amount: '₹50,000',
    tenure: '12 months',
    note: 'new kiln equipment',
    interest: '1 Lender interested',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzzSuHOpEJn-7xe_AibaeP3BNgyVm1sqY9bXQ5vIYvcq-79NQCh2y_iFSBGk36s3oybmkVsCRLc51jEdrOBqHM5E55whcfLhJqMiK32jyP2wIkyr3jqZ0rDwBbjYxu6IeDiI81XyIwD1nrloftvPQ02rxFV0Qr-0eSMEUYcMaQmUXDwg7sQ-besw5_7gDFh78oFgPGVOUwjNNWBYEH5WYnqwJYKzRUP4bzbta3oOY7dwj7h_8YaJ5zTJA-xv3FC8rhF79eRsCcKXh3',
    avatars: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA3hLQjdNWbXnIL9iJKiflOBCYQepD67FLny_XMmVvlbMB1INZ9WOVcww8F1O4yV41f5Vj8zm04GtGfxxTE1mAjFWoqtdOF6RTJc0WyDnAWWqPm9jQUcIwNqUL-XnH0TN0cXlwmDsy3EMjKDqBMeYoY6oKSwui1Xnicj61EaQbPSo0gUOifnx5TIcDCQ0GlRoCPmOb67C5r0A6TOnL0GTv_KRoBnCSrvmnb41itPQhebSP-u9C4jgXRvLXXIVMlbFBDWfSqRcqRDSzI'
    ]
  },
  {
    id: 'opp-3',
    name: 'TechFix Solutions',
    category: 'Services',
    location: 'Mumbai',
    score: 620,
    amount: '₹15,000',
    tenure: '3 months',
    note: 'spare parts inventory',
    interest: 'High yield potential',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBp-aRKkGDKeuwqhPEmq7g1UC6fAJe7VnCjIBkl8xQ_owajzWgfUPWgUMJOIyoiN0LKTUspoZaFUGMsePMDyMvyc8wOY0Ht8h_r-OZXBP_HQCuvHb2y_yMdS0aE_gbQkkTv3Lfk4ygKkKjRhjN_MvU6GCEuVhiMMajr7ZRd8kQ8WKCxD3dRBu_V3DmsoDaRhR4lC0m7DzQz96jcsebEXvsWN9aBxHGSMpo1wqkYa05F8THygZ30zTg55ArV1Ig9JnHR1x12es4h9pO8',
    avatars: []
  }
];

function LenderBrowseScreen() {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Near Me');
  const [opportunities, setOpportunities] = useState<Opportunity[]>(defaultOpportunities);
  const [watchlists, setWatchlists] = useState<string[]>([]);
  const [loanOffers, setLoanOffers] = useState<string[]>([]);
  const { user } = useAuth();

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    Toast.show({
      type: type,
      text1: message,
      position: 'top',
    });
  };

  // Fetch dynamic vendor profiles from Supabase and merge
  useEffect(() => {
    const fetchVendors = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'VENDOR')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching search profiles:', error);
        return;
      }

      if (data && data.length > 0) {
        const mapped = data.map((profile) => {
          const rawScore = profile.score || 600;
          const proposedAmt = rawScore >= 750 ? 30000 : rawScore >= 650 ? 50000 : 15000;
          const tenureVal = rawScore >= 750 ? '6 months' : rawScore >= 650 ? '12 months' : '3 months';
          const cat = profile.name?.toLowerCase().includes('ceramics') ? 'Crafts'
                    : profile.name?.toLowerCase().includes('fix') ? 'Services'
                    : 'Retail';
          
          return {
            id: profile.id,
            name: profile.name || 'Anonymous Vendor',
            category: cat,
            location: 'Bengaluru',
            score: rawScore,
            amount: `₹${proposedAmt.toLocaleString('en-IN')}`,
            tenure: tenureVal,
            note: rawScore >= 750 ? 'inventory expansion for the festive season' : 'spare parts inventory',
            interest: rawScore >= 750 ? '4 Lenders interested' : 'High yield potential',
            image: profile.selfie || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlgj-SJy7IHHN72FxR0ksw9nM_XrQpT4CDw_-cf7XWWW3dGev-D7RrwT5t01Jjh9SC4mPC4V72WbitqBuxaang7oo5_1RNOweXOjkLpUEQiI6VM9qNtBGbdtINFD_1tCcctKfd3S9YQXPcSyZOGjFNvmYK-I3Z1kWnVfeBtMZZfSRlX9Ixyo_i322Hmo4RCrCVfMZUl6pIdFZAF7AUYxALh1sSDJykFkLtVia9Fehqnn39siVkTBQ_F8WeSDNBCMApg9u7YLxNIXlV',
            avatars: [],
            funding_status: profile.funding_status || 'LOOKING_FOR_FUNDS'
          };
        });

        // Deduplicate default values in case user registers with the same names
        const filteredDefault = defaultOpportunities.filter(
          def => !mapped.some(m => m.name.toLowerCase() === def.name.toLowerCase())
        );

        setOpportunities([...mapped, ...filteredDefault]);
      } else {
        setOpportunities(defaultOpportunities);
      }
    };

    fetchVendors();

    const fetchUserData = async () => {
      if (!user) return;
      const [watchRes, offerRes] = await Promise.all([
        supabase.from('watchlists').select('vendor_id').eq('lender_id', user.id),
        supabase.from('loan_offers').select('vendor_id').eq('lender_id', user.id)
      ]);
      
      if (watchRes.data) {
        setWatchlists(watchRes.data.map(w => w.vendor_id));
      }
      if (offerRes.data) {
        setLoanOffers(offerRes.data.map(o => o.vendor_id));
      }
    };
    fetchUserData();

    const channel = supabase
      .channel(`lender-profiles-changes_${Date.now()}_${Math.random()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          setOpportunities((prev) => 
            prev.map(opp => 
              opp.id === payload.new.id 
                ? { ...opp, funding_status: payload.new.funding_status } 
                : opp
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleToggleWatchlist = async (oppId: string) => {
    if (!user) return;
    const isSaved = watchlists.includes(oppId);
    if (isSaved) {
      await supabase.from('watchlists').delete().eq('lender_id', user.id).eq('vendor_id', oppId);
      setWatchlists(prev => prev.filter(id => id !== oppId));
      showToast('Watchlist Updated. Profile removed.', 'info');
    } else {
      await supabase.from('watchlists').insert({ lender_id: user.id, vendor_id: oppId });
      setWatchlists(prev => [...prev, oppId]);
      showToast('Watchlist Updated. Profile added.', 'success');
    }
  };

  const handleSendOffer = async (oppId: string, amount: string) => {
    if (!user) return;
    const numericAmount = parseInt(amount.replace(/[^0-9]/g, '')) || 10000;
    
    await supabase.from('loan_offers').insert({
      lender_id: user.id,
      vendor_id: oppId,
      amount: numericAmount,
      interest_rate: 12,
      tenure: '6 months',
      status: 'PENDING'
    });
    setLoanOffers(prev => [...prev, oppId]);
    showToast('Offer Submitted. Pending vendor review.', 'success');
  };

  // Filter logic
  const filteredOpps = opportunities.filter((opp) => {
    // 1. Search Query filter
    const matchesSearch = 
      opp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Pill Filter
    if (selectedFilter === 'High Score') {
      return opp.score >= 750;
    }
    if (selectedFilter === 'Micro-Retail') {
      return opp.category === 'Retail' || opp.category === 'Micro-Retail';
    }

    return true; // "Near Me" displays all
  });

  const getScoreColor = (score: number) => {
    if (score >= 750) return '#2D7D46';
    if (score >= 650) return '#D4820A';
    return '#C0392B';
  };

  const getScoreBg = (score: number) => {
    if (score >= 750) return '#2D7D4615';
    if (score >= 650) return '#ffddb440';
    return '#C0392B15';
  };

  const renderOpportunityCard = (opp: Opportunity) => {
    const isFunded = opp.funding_status === 'FUNDED';
    const isSaved = watchlists.includes(opp.id);
    const hasOffered = loanOffers.includes(opp.id);

    return (
      <View key={opp.id} style={[styles.oppCard, isFunded && { opacity: 0.6 }]}>
        {isFunded && (
          <View style={styles.fundedOverlay}>
            <Text style={styles.fundedOverlayText}>FUNDED</Text>
          </View>
        )}
        <View style={styles.oppCardTop}>
          <View style={styles.oppCardUser}>
            <Image source={{ uri: opp.image }} style={styles.oppCardAvatar} />
            <View>
              <Text style={styles.oppCardName}>{opp.name}</Text>
              <View style={styles.oppCardDetailsRow}>
                <SymbolView name="storefront" size={12} tintColor="#6B6B6B" />
                <Text style={styles.oppCardDetailsText}>
                  {opp.category} • {opp.location}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => handleToggleWatchlist(opp.id)}>
              <SymbolView name={isSaved ? "bookmark.fill" : "bookmark"} size={22} tintColor={isSaved ? "#D4820A" : "#6B6B6B"} />
            </Pressable>
            <View style={[styles.oppScoreBadge, { backgroundColor: getScoreBg(opp.score) }]}>
              <View style={[styles.oppScoreDot, { backgroundColor: getScoreColor(opp.score) }]} />
              <Text style={[styles.oppScoreText, { color: getScoreColor(opp.score) }]}>{opp.score}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.oppCardNote}>
          Needs <Text style={styles.oppCardBoldAmount}>{opp.amount}</Text> for {opp.note} ({opp.tenure} tenure).
        </Text>

        <View style={styles.oppCardDivider} />

        <View style={styles.oppCardFooter}>
          <View style={styles.oppFooterLenders}>
            {opp.avatars && opp.avatars.length > 0 ? (
              <View style={styles.avatarOverlapContainer}>
                {opp.avatars.map((av, idx) => (
                  <Image key={idx} source={{ uri: av }} style={[styles.overlapAvatar, { marginLeft: idx > 0 ? -10 : 0 }]} />
                ))}
                <Text style={styles.oppFooterLenderText}>{opp.interest}</Text>
              </View>
            ) : (
              <Text style={[styles.oppFooterLenderText, { marginLeft: 0 }]}>{opp.interest}</Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable 
              onPress={() => showToast(`Profile. Loading data for ${opp.name}.`, 'info')}
              style={styles.viewProfileBtn}
              disabled={isFunded}
            >
              <Text style={styles.viewProfileBtnText}>PROFILE</Text>
            </Pressable>
            <Pressable 
              onPress={() => handleSendOffer(opp.id, opp.amount)}
              style={[styles.viewProfileBtn, { backgroundColor: hasOffered ? '#6B6B6B' : '#D4820A', borderColor: hasOffered ? '#6B6B6B' : '#D4820A' }]}
              disabled={isFunded || hasOffered}
            >
              <Text style={[styles.viewProfileBtnText, { color: '#ffffff' }]}>{hasOffered ? 'OFFERED' : 'OFFER'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.lenderBrowseContainer}>

      {/* Header */}
      <View style={styles.lenderBrowseHeader}>
        <View style={styles.lenderNavLeft}>
          <Image
            alt="Suresh Profile"
            style={styles.lenderNavAvatar}
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3hLQjdNWbXnIL9iJKiflOBCYQepD67FLny_XMmVvlbMB1INZ9WOVcww8F1O4yV41f5Vj8zm04GtGfxxTE1mAjFWoqtdOF6RTJc0WyDnAWWqPm9jQUcIwNqUL-XnH0TN0cXlwmDsy3EMjKDqBMeYoY6oKSwui1Xnicj61EaQbPSo0gUOifnx5TIcDCQ0GlRoCPmOb67C5r0A6TOnL0GTv_KRoBnCSrvmnb41itPQhebSP-u9C4jgXRvLXXIVMlbFBDWfSqRcqRDSzI' }}
          />
          <Text style={styles.lenderWordmark}>Vendor<Text style={{ color: '#895100' }}>PASS</Text></Text>
        </View>
        <View style={styles.lenderNavRight}>
          <Pressable onPress={() => showToast('Map View. Overlay active.', 'info')} style={styles.navIconPressable}>
            <SymbolView name="building.columns" size={22} tintColor="#534435" />
            <View style={styles.activeDot} />
          </Pressable>
          <Pressable onPress={() => showToast('Inbox. Viewing messages.', 'info')} style={styles.navIconPressable}>
            <SymbolView name="notifications" size={22} tintColor="#534435" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollBodyContent}
      >
        {/* Search Input Bar */}
        <View style={styles.searchBarContainer}>
          <SymbolView name="search" size={18} tintColor="#A0A0A0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchTextInput}
            placeholder="Search vendors, locations..."
            placeholderTextColor="#A0A0A0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Pills Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
          <Pressable 
            onPress={() => setSelectedFilter('Near Me')}
            style={[styles.pill, selectedFilter === 'Near Me' && styles.pillActive]}
          >
            <Text style={[styles.pillText, selectedFilter === 'Near Me' && styles.pillTextActive]}>Near Me</Text>
          </Pressable>
          <Pressable 
            onPress={() => setSelectedFilter('High Score')}
            style={[styles.pill, selectedFilter === 'High Score' && styles.pillActive]}
          >
            <Text style={[styles.pillText, selectedFilter === 'High Score' && styles.pillTextActive]}>High Score</Text>
          </Pressable>
          <Pressable 
            onPress={() => setSelectedFilter('Micro-Retail')}
            style={[styles.pill, selectedFilter === 'Micro-Retail' && styles.pillActive]}
          >
            <Text style={[styles.pillText, selectedFilter === 'Micro-Retail' && styles.pillTextActive]}>Micro-Retail</Text>
          </Pressable>
        </ScrollView>

        {/* Side-by-Side Stats Cards */}
        <View style={styles.statsCardsRow}>
          <View style={styles.statsCard}>
            <View style={styles.statsCardInfo}>
              <Text style={styles.statsCardLabel}>VERIFIED TODAY</Text>
              <Text style={styles.statsCardValue}>128+</Text>
            </View>
            <View style={styles.cardWatermarkContainer}>
              <SymbolView name="verified_user" size={44} tintColor="rgba(45, 125, 70, 0.08)" />
            </View>
          </View>
          <View style={styles.statsCard}>
            <View style={styles.statsCardInfo}>
              <Text style={styles.statsCardLabel}>TOTAL VOLUME</Text>
              <Text style={styles.statsCardValue}>₹4.2M</Text>
            </View>
            <View style={styles.cardWatermarkContainer}>
              <SymbolView name="analytics" size={44} tintColor="rgba(68, 98, 116, 0.08)" />
            </View>
          </View>
        </View>

        {/* Top Opportunities Section Header */}
        <View style={styles.oppsHeader}>
          <View>
            <Text style={styles.oppsTitle}>Top Opportunities</Text>
            <Text style={styles.oppsSubtitle}>Based on your portfolio risk settings</Text>
          </View>
          <Pressable onPress={() => showToast('Filters. Sorting options applied.', 'info')} style={styles.sortBtn}>
            <Text style={styles.sortBtnText}>SORT BY SCORE</Text>
            <SymbolView name="chevron.down" size={12} tintColor="#895100" />
          </Pressable>
        </View>

        {/* Opportunity cards list */}
        <View style={styles.oppsList}>
          {filteredOpps.length > 0 ? (
            filteredOpps.map(renderOpportunityCard)
          ) : (
            <View style={styles.emptySearchContainer}>
              <SymbolView name="xmark.circle.fill" size={36} tintColor="#A0A0A0" />
              <Text style={styles.emptySearchText}>No matching opportunities found.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Map FAB */}
      <Pressable 
        onPress={() => showToast('Search Grid. Map view opened.', 'info')}
        style={({ pressed }) => [styles.mapFloatingFab, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
      >
        <SymbolView name="building.columns" size={24} tintColor="#ffffff" />
      </Pressable>

      {/* Bottom Nav Bar */}
      <LenderBottomTabBar activeTab="browse" />
    </View>
  );
}

export default function ExploreScreen() {
  const { user } = useAuth();
  if (user?.role === 'LENDER') {
    return <LenderBrowseScreen />;
  }
  return <VendorCreditHubScreen />;
}

// -------------------- STYLES --------------------
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.four,
  },
  header: {
    marginVertical: Spacing.four,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
    marginBottom: Spacing.one,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  section: {
    marginBottom: Spacing.five,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: Spacing.three,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },

  loanCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  loanTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  loanProvider: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  divider: {
    height: 1.2,
    marginVertical: Spacing.three,
  },
  loanDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  applyButton: {
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  eduCard: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: Spacing.three,
    alignItems: 'center',
  },
  eduIcon: {
    marginRight: Spacing.three,
  },
  eduDetails: {
    flex: 1,
  },
  eduTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    marginBottom: 2,
  },
  eduDesc: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },

  // -------------------- LENDER BROWSE STYLES --------------------
  lenderBrowseContainer: {
    flex: 1,
    backgroundColor: '#fdf9f3',
    paddingBottom: 80,
  },
  toastOverlay: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: '#1c1c18',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  lenderBrowseHeader: {
    height: 64,
    backgroundColor: '#fdf9f3',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  lenderNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lenderNavAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#895100',
  },
  lenderWordmark: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
  },
  lenderNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navIconPressable: {
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C0392B',
  },
  scrollBody: {
    flex: 1,
  },
  scrollBodyContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 20,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E8E0D5',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchTextInput: {
    flex: 1,
    height: '100%',
    color: '#1c1c18',
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  pillsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  pill: {
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#E8E0D5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  pillActive: {
    backgroundColor: '#D4820A',
    borderColor: '#D4820A',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  pillTextActive: {
    color: '#ffffff',
  },
  statsCardsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E8E0D5',
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statsCardInfo: {
    zIndex: 10,
  },
  statsCardLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#895100',
    letterSpacing: 1.0,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  statsCardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1c18',
    marginTop: 6,
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  cardWatermarkContainer: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    opacity: 0.6,
  },
  oppsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  oppsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  oppsSubtitle: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#895100',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  oppsList: {
    gap: 16,
  },
  oppCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E8E0D5',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  fundedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fundedOverlayText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#895100',
    letterSpacing: 4,
    transform: [{ rotate: '-15deg' }],
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    opacity: 0.8,
  },
  oppCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  oppCardUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  oppCardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  oppCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  oppCardDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  oppCardDetailsText: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  oppScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  oppScoreDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  oppScoreText: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  oppCardNote: {
    fontSize: 13,
    lineHeight: 18,
    color: '#534435',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  oppCardBoldAmount: {
    fontWeight: 'bold',
    color: '#895100',
  },
  oppCardDivider: {
    height: 1,
    backgroundColor: '#E8E0D5',
    marginVertical: 4,
  },
  oppCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  oppFooterLenders: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarOverlapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlapAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  oppFooterLenderText: {
    fontSize: 11,
    color: '#6B6B6B',
    fontWeight: '500',
    marginLeft: 8,
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewProfileBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#895100',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  emptySearchContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptySearchText: {
    fontSize: 13,
    color: '#A0A0A0',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  mapFloatingFab: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#895100',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 99,
  },
  lenderBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#fdf9f3',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E0D5',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 16,
    paddingTop: 8,
    zIndex: 100,
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        maxWidth: 600,
        alignSelf: 'center',
        left: '50%' as any,
        transform: 'translateX(-50%)' as any,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
      }
    }) as any,
  },
  lenderBottomBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  lenderBottomBarItemActive: {
    opacity: 1.0,
  },
  lenderBottomBarText: {
    fontSize: 10,
    color: '#534435',
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderBottomBarTextActive: {
    fontSize: 10,
    color: '#895100',
    marginTop: 4,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
});

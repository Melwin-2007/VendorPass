import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { SymbolView } from '@/components/symbol-view';
import { router, useFocusEffect } from 'expo-router';
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
  isRealRequest?: boolean;
  realRequest?: any;
}


function LenderBrowseScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Near Me');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [watchlists, setWatchlists] = useState<string[]>([]);
  const [loanOffers, setLoanOffers] = useState<any[]>([]);
  const { user } = useAuth();

  // Custom offer modal states
  const [isOfferModalVisible, setIsOfferModalVisible] = useState(false);
  const [selectedRequestForOffer, setSelectedRequestForOffer] = useState<Opportunity | null>(null);
  const [lenderOfferAmount, setLenderOfferAmount] = useState('50000');
  const [lenderOfferRate, setLenderOfferRate] = useState('12.5');
  const [lenderOfferTenure, setLenderOfferTenure] = useState(6);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    Toast.show({
      type: type,
      text1: message,
      position: 'top',
    });
  };

  const mockLenderAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop'
  ];

  // Fetch dynamic vendor profiles and public requests from Supabase
  const fetchVendors = async () => {
    const [profilesRes, publicRequestsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('role', 'VENDOR')
        .order('created_at', { ascending: false }),
      supabase
        .from('public_loan_requests')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })
    ]);

    if (profilesRes.error) {
      console.error('Error fetching search profiles:', profilesRes.error);
      return;
    }

    const profiles = profilesRes.data || [];
    const publicRequests = publicRequestsRes.data || [];

    if (profiles.length > 0) {
      const validProfiles = profiles.filter(profile => !!profile.name && profile.name.trim() !== '');
      const mapped = validProfiles.map((profile) => {
        const rawScore = profile.trust_score_data?.trust_score ?? profile.score ?? 620;
        
        // Dynamic simulated data based on score
        const getSimulatedLendersText = (score: number) => {
          if (score >= 750) {
            const count = Math.floor((score - 700) / 12) + 2;
            return `${count} Lenders interested`;
          } else if (score >= 650) {
            const count = Math.floor((score - 600) / 15) + 1;
            return `${count} Lenders interested`;
          } else {
            const count = Math.max(1, Math.floor((score - 500) / 40));
            return `${count} Lender interested`;
          }
        };

        const getSimulatedAvatars = (score: number) => {
          let count = 1;
          if (score >= 750) count = 3;
          else if (score >= 650) count = 2;
          return mockLenderAvatars.slice(0, count);
        };

        // Find if this vendor has an active public request
        const realReq = publicRequests.find((req: any) => req.vendor_id === profile.id);

        const cat = profile.name?.toLowerCase().includes('organic') ? 'Retail'
                  : profile.name?.toLowerCase().includes('ceramics') ? 'Crafts'
                  : profile.name?.toLowerCase().includes('fix') ? 'Services'
                  : 'Retail';

        if (realReq) {
          return {
            id: profile.id,
            name: profile.name,
            category: cat,
            location: 'Bengaluru',
            score: rawScore,
            amount: `₹${Number(realReq.amount).toLocaleString('en-IN')}`,
            tenure: realReq.tenure,
            note: realReq.reason,
            interest: `${realReq.interest_rate}% p.a. • ${getSimulatedLendersText(rawScore)}`,
            image: profile.selfie || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlgj-SJy7IHHN72FxR0ksw9nM_XrQpT4CDw_-cf7XWWW3dGev-D7RrwT5t01Jjh9SC4mPC4V72WbitqBuxaang7oo5_1RNOweXOjkLpUEQiI6VM9qNtBGbdtINFD_1tCcctKfd3S9YQXPcSyZOGjFNvmYK-I3Z1kWnVfeBtMZZfSRlX9Ixyo_i322Hmo4RCrCVfMZUl6pIdFZAF7AUYxALh1sSDJykFkLtVia9Fehqnn39siVkTBQ_F8WeSDNBCMApg9u7YLxNIXlV',
            avatars: getSimulatedAvatars(rawScore),
            funding_status: profile.funding_status || 'LOOKING_FOR_FUNDS',
            isRealRequest: true,
            realRequest: realReq
          };
        } else {
          const proposedAmt = rawScore >= 750 ? 30000 : rawScore >= 650 ? 50000 : 15000;
          const tenureVal = rawScore >= 750 ? '6 Months' : rawScore >= 650 ? '12 Months' : '3 Months';
          
          return {
            id: profile.id,
            name: profile.name,
            category: cat,
            location: 'Bengaluru',
            score: rawScore,
            amount: `₹${proposedAmt.toLocaleString('en-IN')}`,
            tenure: tenureVal,
            note: rawScore >= 750 ? 'inventory expansion for the festive season' : 'spare parts inventory',
            interest: getSimulatedLendersText(rawScore),
            image: profile.selfie || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlgj-SJy7IHHN72FxR0ksw9nM_XrQpT4CDw_-cf7XWWW3dGev-D7RrwT5t01Jjh9SC4mPC4V72WbitqBuxaang7oo5_1RNOweXOjkLpUEQiI6VM9qNtBGbdtINFD_1tCcctKfd3S9YQXPcSyZOGjFNvmYK-I3Z1kWnVfeBtMZZfSRlX9Ixyo_i322Hmo4RCrCVfMZUl6pIdFZAF7AUYxALh1sSDJykFkLtVia9Fehqnn39siVkTBQ_F8WeSDNBCMApg9u7YLxNIXlV',
            avatars: getSimulatedAvatars(rawScore),
            funding_status: profile.funding_status || 'LOOKING_FOR_FUNDS',
            isRealRequest: false
          };
        }
      });

      // Sort real requests first
      mapped.sort((a, b) => {
        if (a.isRealRequest && !b.isRealRequest) return -1;
        if (!a.isRealRequest && b.isRealRequest) return 1;
        return 0;
      });

      setOpportunities(mapped);
    } else {
      setOpportunities([]);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      await fetchVendors();
      if (!user) return;
      const [watchRes, offerRes] = await Promise.all([
        supabase.from('watchlists').select('vendor_id').eq('lender_id', user.id),
        supabase.from('loan_offers').select('*').eq('lender_id', user.id)
      ]);
      
      if (watchRes.data) {
        setWatchlists(watchRes.data.map(w => w.vendor_id));
      }
      if (offerRes.data) {
        setLoanOffers(offerRes.data);
      }
    };
    fetchUserData();

    // Listen for updates to profiles and public requests
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

    const channelRequests = supabase
      .channel(`lender-requests-changes_${Date.now()}_${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'public_loan_requests' },
        () => {
          fetchVendors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(channelRequests);
    };
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      const fetchOffers = async () => {
        const { data } = await supabase.from('loan_offers').select('*').eq('lender_id', user.id);
        if (data) setLoanOffers(data);
      };
      fetchOffers();
    }, [user])
  );

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

  const handleSendCustomOffer = async () => {
    if (!user || !selectedRequestForOffer) return;
    setIsSubmittingOffer(true);

    const amt = parseFloat(lenderOfferAmount.replace(/,/g, ''));
    const rate = parseFloat(lenderOfferRate) || 12.0;

    if (isNaN(amt) || amt <= 0) {
      showToast('Invalid Amount. Please enter a valid number.', 'error');
      setIsSubmittingOffer(false);
      return;
    }

    const { error } = await supabase.from('loan_offers').insert({
      lender_id: user.id,
      vendor_id: selectedRequestForOffer.id,
      amount: amt,
      interest_rate: rate,
      tenure: `${lenderOfferTenure} Months`,
      status: 'PENDING'
    });

    if (error) {
      showToast('Submission Failed. Unable to send offer.', 'error');
    } else {
      setLoanOffers(prev => [...prev, { vendor_id: selectedRequestForOffer.id, created_at: new Date().toISOString() }]);
      showToast('Offer Submitted. Pending vendor review.', 'success');
      setIsOfferModalVisible(false);
    }
    setIsSubmittingOffer(false);
  };

  // Filter logic
  const filteredOpps = opportunities.filter((opp) => {
    // Hide obsolete requests that the lender has already addressed
    if (opp.isRealRequest && opp.realRequest) {
      const reqTime = new Date(opp.realRequest.created_at).getTime();
      const latestOffer = loanOffers
        .filter(o => o.vendor_id === opp.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
      // If we made an offer at or after the time of this request, hide it.
      if (latestOffer && new Date(latestOffer.created_at).getTime() >= reqTime - 5000) {
        return false;
      }
    }

    const matchesSearch = 
      opp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'High Score') {
      return opp.score >= 750;
    }
    if (selectedFilter === 'Micro-Retail') {
      return opp.category === 'Retail' || opp.category === 'Micro-Retail';
    }

    return true;
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
    const hasOffered = loanOffers.some(o => o.vendor_id === opp.id);

    return (
      <Pressable 
        key={opp.id} 
        onPress={() => {
          router.push({
            pathname: '/vendor-detail',
            params: {
              vendorId: opp.id,
              oppId: opp.isRealRequest ? opp.realRequest?.id : '',
              isReal: opp.isRealRequest ? 'true' : 'false',
              amount: opp.amount,
              tenure: opp.tenure,
              note: opp.note,
              category: opp.category,
              location: opp.location,
              interest_rate: opp.isRealRequest ? opp.realRequest?.interest_rate?.toString() : '12'
            }
          });
        }}
        style={({ pressed }) => [styles.oppCard, isFunded && { opacity: 0.6 }, pressed && { opacity: 0.95 }]}
      >
        {isFunded && (
          <View style={styles.fundedOverlay}>
            <Text style={styles.fundedOverlayText}>FUNDED</Text>
          </View>
        )}
        <View style={styles.oppCardTop}>
          <View style={styles.oppCardUser}>
            <Image source={{ uri: opp.image }} style={styles.oppCardAvatar} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Text style={styles.oppCardName} numberOfLines={2}>{opp.name}</Text>
                <View style={[styles.oppScoreBadge, { backgroundColor: getScoreBg(opp.score) }]}>
                  <Text style={[styles.oppScoreText, { color: getScoreColor(opp.score) }]}>• {opp.score}</Text>
                </View>
              </View>
              <View style={styles.oppCardDetailsRow}>
                <SymbolView name="storefront" size={14} tintColor="#A0A0A0" style={{ marginRight: 4 }} />
                <Text style={styles.oppCardDetailsText}>
                  {opp.category} • {opp.location}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.oppCardNote}>
          Needs <Text style={styles.oppCardBoldAmount}>{opp.amount}</Text> for {opp.note} ({opp.tenure.toLowerCase()} tenure).
        </Text>

        <View style={styles.oppCardDivider} />

        <View style={styles.oppCardFooter}>
          <View style={styles.oppFooterLenders}>
            <View style={styles.avatarOverlapContainer}>
              <View style={[styles.overlapCircle, { backgroundColor: '#FCDCB7', zIndex: 2 }]} />
              <View style={[styles.overlapCircle, { backgroundColor: '#C5E2F7', marginLeft: -8, zIndex: 1 }]} />
            </View>
            <Text style={styles.oppFooterLenderText}>{opp.interest}</Text>
          </View>

          <View style={styles.viewProfileBtn}>
            <Text style={styles.viewProfileBtnText}>VIEW PROFILE</Text>
            <SymbolView name="arrow_forward" size={16} tintColor="#895100" style={{ marginLeft: 6 }} />
          </View>
        </View>
      </Pressable>
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
            <View style={styles.lenderEmptySearchContainer}>
              <SymbolView name="xmark.circle.fill" size={36} tintColor="#A0A0A0" />
              <Text style={styles.lenderEmptySearchText}>No matching opportunities found.</Text>
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

      {/* Lender Terms Entry Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isOfferModalVisible}
        onRequestClose={() => setIsOfferModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackground} onPress={() => setIsOfferModalVisible(false)} />
          <View style={styles.modalCardContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Submit Terms to {selectedRequestForOffer?.name}</Text>
              <Pressable onPress={() => setIsOfferModalVisible(false)} style={styles.modalCloseBtn}>
                <SymbolView tintColor="#1c1c18" name="xmark" size={20} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={styles.inputLabel}>OFFER AMOUNT (₹)</Text>
              <TextInput
                style={styles.customModalInput}
                placeholder="Amount"
                keyboardType="numeric"
                value={lenderOfferAmount}
                onChangeText={setLenderOfferAmount}
              />

              <Text style={styles.inputLabel}>INTEREST RATE (% p.a.)</Text>
              <TextInput
                style={styles.customModalInput}
                placeholder="Rate"
                keyboardType="numeric"
                value={lenderOfferRate}
                onChangeText={setLenderOfferRate}
              />

              <Text style={styles.inputLabel}>SELECT TENURE</Text>
              <View style={styles.tenureRow}>
                {[3, 6, 12].map((m) => (
                  <Pressable 
                    key={m}
                    onPress={() => setLenderOfferTenure(m)}
                    style={[styles.tenureOption, lenderOfferTenure === m && styles.tenureOptionActive]}
                  >
                    <Text style={[styles.tenureOptionText, lenderOfferTenure === m && styles.tenureOptionTextActive]}>{m} Mo</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.repaymentSummaryCard}>
                <Text style={styles.repaymentSummaryTitle}>ESTIMATED REPAYMENT DETAIL</Text>
                <View style={styles.repaymentSummaryRow}>
                  <Text style={styles.repaymentDetailLabel}>Monthly EMI</Text>
                  <Text style={styles.repaymentDetailVal}>
                    ₹{Math.round((parseFloat(lenderOfferAmount) || 0) * (1 + (parseFloat(lenderOfferRate) || 0) / 100) / lenderOfferTenure).toLocaleString('en-IN')} / mo
                  </Text>
                </View>
                <View style={styles.repaymentSummaryRow}>
                  <Text style={styles.repaymentDetailLabel}>Total Payback</Text>
                  <Text style={styles.repaymentDetailVal}>
                    ₹{Math.round((parseFloat(lenderOfferAmount) || 0) * (1 + (parseFloat(lenderOfferRate) || 0) / 100)).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <Pressable 
                style={styles.modalPrimaryBtn} 
                onPress={handleSendCustomOffer}
                disabled={isSubmittingOffer}
              >
                {isSubmittingOffer ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalPrimaryBtnText}>Send Offer</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function BankApiConsoleScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const handleCopy = () => {
    Toast.show({ type: 'success', text1: 'API Key copied to clipboard', position: 'top' });
  };

  const handleInvite = () => {
    Toast.show({ type: 'success', text1: 'Invite link copied. Share with your partners.', position: 'top' });
  };

  return (
    <View style={[styles.lenderBrowseContainer, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.lenderBrowseHeader}>
        <View style={styles.lenderNavLeft}>
          <Image
            alt="Bank Profile"
            style={styles.lenderNavAvatar}
            source={{ uri: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop' }}
          />
          <Text style={styles.lenderWordmark}>Vendor<Text style={{ color: '#895100' }}>PASS</Text></Text>
        </View>
        <View style={styles.lenderNavRight}>
          <Pressable onPress={() => Toast.show({type:'info',text1:'Docs',position:'top'})} style={styles.navIconPressable}>
            <SymbolView name="doc.text" size={22} tintColor="#534435" />
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A3A4A', fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif', marginBottom: 8 }}>
          TrustScore™ API Console
        </Text>
        <Text style={{ fontSize: 14, color: '#6B6B6B', marginBottom: 32 }}>
          Manage your API credentials and track your institutional underwriting requests.
        </Text>

        {/* API Key Box */}
        <View style={{ backgroundColor: '#1A3A4A', borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 11, color: '#A0B0BA', fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
            LIVE API KEY
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8 }}>
            <Text style={{ flex: 1, color: '#FFF', fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace', fontSize: 13 }} numberOfLines={1}>
              sk_live_vendorpass_9x8f2k1m...
            </Text>
            <Pressable onPress={handleCopy} style={{ padding: 8, backgroundColor: '#D4820A', borderRadius: 8, marginLeft: 12 }}>
              <SymbolView name="doc.on.doc" size={16} tintColor="#FFF" />
            </Pressable>
          </View>
        </View>

        {/* Usage Bar */}
        <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#E8E0D5' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#1A3A4A' }}>API USAGE TODAY</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#895100' }}>2,450 / 10,000</Text>
          </View>
          <View style={{ height: 8, backgroundColor: '#E8E0D5', borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ width: '24.5%', height: '100%', backgroundColor: '#D4820A', borderRadius: 4 }} />
          </View>
        </View>

        {/* Code Snippet */}
        <View style={{ backgroundColor: '#F9F5EF', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#E8E0D5' }}>
          <Text style={{ fontSize: 11, color: '#6B6B6B', fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
            SAMPLE CURL COMMAND
          </Text>
          <View style={{ backgroundColor: '#1C1C1E', padding: 16, borderRadius: 12 }}>
            <Text style={{ color: '#A0B0BA', fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace', fontSize: 12, lineHeight: 20 }}>
              <Text style={{ color: '#D4820A' }}>curl</Text> -X POST https://api.vendorpass.com/v1/score \
              {'\n'}  -H <Text style={{ color: '#2D7D46' }}>"Authorization: Bearer sk_live_..."</Text> \
              {'\n'}  -d <Text style={{ color: '#2D7D46' }}>'{"{"}"vendor_id":"V-00123"{"}"}'</Text>
            </Text>
          </View>
        </View>

        {/* Invite Button */}
        <Pressable 
          style={{ backgroundColor: '#D4820A', borderRadius: 16, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
          onPress={handleInvite}
        >
          <SymbolView name="person.badge.plus" size={20} tintColor="#FFF" style={{ marginRight: 8 }} />
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>Invite a Partner</Text>
        </Pressable>
      </ScrollView>

      <LenderBottomTabBar activeTab="explore" />
    </View>
  );
}

export default function ExploreScreen() {
  const { user } = useAuth();
  if (user?.role === 'BANK') {
    return <BankApiConsoleScreen />;
  }
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
  emptySearchText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontWeight: 'bold',
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
    borderRadius: 24,
    padding: 24,
    shadowColor: '#1c1c18',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
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
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  oppCardAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  oppCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
    flexShrink: 1,
    paddingRight: 6,
  },
  oppCardDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  oppCardDetailsText: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
  },
  oppScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  oppScoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono' : 'monospace',
  },
  oppCardNote: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1c1c18',
    fontFamily: Platform.OS === 'web' ? 'DM Sans' : 'sans-serif',
    marginTop: 4,
  },
  oppCardBoldAmount: {
    fontWeight: 'bold',
    color: '#895100',
  },
  oppCardDivider: {
    height: 1,
    backgroundColor: '#E8E0D5',
    marginVertical: 8,
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
  overlapCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ffffff',
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
  },
  viewProfileBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#895100',
    fontFamily: Platform.OS === 'web' ? 'Sora' : 'sans-serif',
  },
  lenderEmptySearchContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  lenderEmptySearchText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCardContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3A4A',
    fontFamily: Platform.OS === 'web' ? 'Playfair Display' : 'serif',
  },
  modalCloseBtn: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  customModalInput: {
    backgroundColor: '#F9F5EF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3A4A',
  },
  tenureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  tenureOption: {
    flex: 1,
    backgroundColor: '#F9F5EF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tenureOptionActive: {
    borderColor: '#D4820A',
    backgroundColor: '#FFF',
  },
  tenureOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6B6B',
  },
  tenureOptionTextActive: {
    color: '#D4820A',
    fontWeight: '700',
  },
  repaymentSummaryCard: {
    backgroundColor: '#1A3A4A',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    marginBottom: 20,
  },
  repaymentSummaryTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A0B0BA',
    letterSpacing: 1,
    marginBottom: 12,
  },
  repaymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  repaymentDetailLabel: {
    fontSize: 14,
    color: '#FFF',
  },
  repaymentDetailVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4820A',
  },
  modalPrimaryBtn: {
    backgroundColor: '#D4820A',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  modalPrimaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

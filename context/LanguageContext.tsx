import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "id";

// ─── Translations Dictionary ───────────────────────────────────────────────
const translations = {
  en: {
    // General
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    close: "Close",
    loading: "Loading...",
    none: "None",
    ok: "OK",
    goBack: "Go Back",
    readLess: "Read less",
    continue: "Continue",

    // Auth
    authTagline: "Your personal movie universe",
    signIn: "Sign In",
    welcomeBack: "Welcome back 👋",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot password?",
    orContinueWith: "Or continue with",
    google: "Google",
    noAccount: "Don't have an account?",
    signUpNow: "Sign up now",
    emailPasswordRequired: "Email and password are required.",
    signUp: "Sign Up",
    joinCommunity: "Join our movie community ✨",
    username: "Username",
    confirmPassword: "Confirm Password",
    createAccount: "Create Account",
    orSignUpWith: "Or sign up with",
    alreadyHaveAccount: "Already have an account?",
    signInHere: "Sign in here",
    allFieldsRequired: "All fields are required.",
    passwordsDontMatch: "Passwords do not match.",
    passwordTooShort: "Password must be at least 6 characters.",
    accountCreated: "Account Created Successfully!",
    checkEmailVerification:
      "Please check your email to verify your account before signing in.",
    backToLogin: "Back to Login",
    forgotPasswordTitle: "Forgot Password?",
    forgotPasswordDesc:
      "Enter your email address and we will send you a link to reset your password.",
    emailSent: "Email Sent!",
    checkInboxForReset:
      "Check your inbox at {email} for the reset password link.",
    emailRequired: "Email is required.",
    or: "or",
    createNewAccount: "Create new account",
    skipAndExplore: "Skip & Explore Movies →",
    resetPassword: "Reset Password",
    resetPasswordTitle: "New Password",
    resetPasswordSub: "Enter a new password of at least 8 characters.",
    confirmNewPassword: "Confirm New Password",
    savePassword: "Save Password",
    successResetTitle: "Success!",
    successResetMsg:
      "Your password has been updated. Redirecting you to the home screen...",
    newPasswordSameAsOldErr: "New password cannot be the same as old password.",
    recoverySessionExpiredErr:
      "Recovery session is invalid or has expired. Please request a new link.",
    resetPasswordSystemErr:
      "A system error occurred while resetting the password.",

    // Profile / Settings
    settings: "Settings",
    diary: "Watched",
    reviews: "Reviews",
    rating: "Rating",
    notifications: "Notifications",
    profile: "Profile",
    logs: "Logs",
    exportWatchlist: "Export Watchlist",
    about: "WatchlistID",
    aboutNav: "About",
    collapseSidebar: "Collapse sidebar",
    expandSidebar: "Expand sidebar",
    language: "Language",
    signOut: "Sign Out",
    total: "Total",
    watched: "Watched",
    toWatch: "To Watch",
    memberSince: "Member since",
    shareProfile: "Share Profile",
    share: "Share",
    editProfile: "Edit Profile",
    tapToAddBio: "Tap ✏️ to add a bio",
    shortBioPlaceholder: "Write a short bio…",
    yourNamePlaceholder: "Your name",
    nameLabel: "Name",
    bioLabel: "Bio",

    // Social
    followers: "Followers",
    following: "Following",
    follow: "Follow",
    unfollow: "Unfollow",
    noUsersFound: "No users found",
    noUsersFoundSub: "Try searching for another username",
    findYourFriends: "Find your friends",
    findYourFriendsSub: "Search for movie enthusiasts by their username",
    viewProfile: "View Profile",
    searchUserPlaceholder: "Search name or username...",
    searchUsers: "Search Users",
    usersTab: "Users",
    activityFeedEmpty: "Nothing to see here",
    activityFeedEmptySub: "Follow your friends to see what they're watching!",
    findFriends: "Find Friends",
    watchedLabel: "Watched",
    agoMin: "{n}m ago",
    agoHour: "{n}h ago",
    agoDay: "{n}d ago",

    // Diary / Log Modal
    emptyDiary: "No watched movies yet.",
    emptyWatched: "No watched movies yet.",
    emptyToWatch: "Your watchlist is empty.",
    logMovie: "Log Movie",
    logShow: "Log Show",
    watchedOn: "Watched on",
    yourRating: "Your Rating",
    ratingHintDefault: "Choose a rating for this movie",
    reviewOptional: "Review (Optional)",
    reviewPlaceholder: "Write your review, thoughts, or feelings...",
    today: "Today",
    preview: "Preview",
    previewPlaceholder: "Type something to see preview...",
    starsOutOf5: "{n} / 5 stars",

    // Modals
    signOutConfirmTitle: "Sign Out?",
    signOutConfirmDesc: "Are you sure you want to log out of your account?",
    deleteLogTitle: "Delete Watched Entry?",
    deleteLogDesc:
      "Are you sure you want to delete this from your Watched list? This action cannot be undone.",
    changePassword: "Change Password",
    passwordChangedSuccess: "Password changed successfully!",
    newPassword: "New Password",
    min8Chars: "At least 8 characters",
    repeatNewPassword: "Repeat new password",
    passwordMin8Err: "Password must be at least 8 characters.",
    passwordsMismatchErr: "Passwords do not match. Try again.",

    // Spoilers
    containsSpoiler: "Contains Spoilers",
    spoilerDesc:
      "Hide your review behind a warning to protect others from plot reveals.",
    clickToReveal: "Review contains spoilers. Click to reveal.",
    hideSpoilers: "Hide Spoilers",

    // Language Names
    english: "English",
    indonesian: "Bahasa Indonesia",

    // Tabs
    tabHome: "Home",
    tabDiscover: "Discover",
    tabWatchlist: "Watchlist",
    tabProfile: "Profile",

    // Home
    trendingMovies: "Trending Movies",
    trendingShows: "Trending Shows",
    popular: "Popular",
    topRatedMovies: "Top Rated Movies",
    topRatedShows: "Top Rated Shows",
    recentlyViewed: "Recently Viewed",
    seeAll: "See All",
    browse: "Browse",
    browseSub: "Discover the latest and greatest in film & TV",
    browseByGenre: "Browse by Genre",

    // Genres
    genreAction: "Action",
    genreComedy: "Comedy",
    genreDrama: "Drama",
    genreHorror: "Horror",
    genreSciFi: "Sci-Fi",
    genreRomance: "Romance",
    genreAdventure: "Adventure",
    genreCrime: "Crime",
    genreThriller: "Thriller",
    genreFantasy: "Fantasy",
    genreMystery: "Mystery",
    genreFamily: "Family",
    genreDocumentary: "Documentary",

    // Discover / Search
    searchPlaceholder: "Search movies, shows, people...",
    discoverTitle: "Discover",
    discoverSub: "Search movies, shows, and people",
    noResults: "No results",
    tryAnother: "Try another keyword.",
    recent: "Recent",
    clearAll: "Clear All",
    trendingSearches: "Trending Searches",
    trendingNow: "Trending Now",
    trendingToday: "Trending Today",
    trendingTV: "Trending TV",
    loadMore: "Load More",
    pageOf: "Page {page} of {total}",
    actor: "Actor",
    catPopularOn: "Popular on WATCHLISTID",
    catTrendingMoviesSub: "What the world is watching right now",
    catTrendingTVSub: "Most-watched series this week",
    catPopularSub: "Most-loved by our community",
    catTopRatedMoviesSub: "Critically acclaimed films of all time",
    catTopRatedTVSub: "The finest TV series ever made",
    filterAll: "All",
    filterMovies: "Movies",
    filterTV: "TV Shows",
    filterAnime: "Anime",
    filterAnimation: "Animation",
    searchIn: "Search in {category}…",
    searchMoviesTVPeople: "Movies, TV shows, people…",
    showingResults: "Showing {count} of {total} results",
    titlesCount: "{count} titles",
    titles: "titles",
    seasons: "Seasons",
    episodeProgress: "Progress: {watched} of {total} episodes",
    seasonCompleted: "Season Completed!",
    noEpisodesFound: "No episodes found",
    noEpisodesFoundSub: "Episodes for this season are not available yet.",

    // Movie Details
    imdbRating: "IMDB RATING",
    popularity: "POPULARITY",
    yourRatingLabel: "YOUR RATING",
    log: "Log",
    playTrailer: "Play Trailer",
    inWatchlist: "In Watchlist",
    addToWatchlist: "Add to Watchlist",
    videos: "Videos",
    videosCount: "{count} videos",
    storyline: "Storyline",
    readMore: "Read more",
    less: "Less",
    topCast: "Top Cast",
    details: "Details",
    userReviews: "User Reviews",
    moreLikeThis: "More Like This",
    votes: "votes",
    preparingExperience: "Preparing experience...",
    contentNotFound: "Oops! Content not found",
    contentNotFoundDesc:
      "We couldn't fetch the details for this title. It might be unavailable or there's a connection issue.",

    // Person Details
    born: "Born",
    birthplace: "Birthplace",
    biography: "Biography",
    knownFor: "Known For",
    filmography: "Filmography",

    // Notifications
    markAllRead: "Mark all read",
    unread: "unread",
    justNow: "Just now",
    allCaughtUp: "All caught up!",
    noNotifications: "You don't have any new notifications at the moment.",

    // Metadata Table
    metaGenre: "Genre",
    metaReleaseDate: "Release Date",
    metaLanguage: "Language",
    metaStatus: "Status",
    metaBudget: "Budget",
    metaRevenue: "Revenue",
    metaRuntime: "Runtime",
    metaProduction: "Production",
    minutes: "min",

    // Watchlist
    myWatchlist: "My Watchlist",
    ratedByYou: "rated by you",
    moviesShowsToWatch: "Movies and shows to watch",
    emptyWatchlistTitle: "Your watchlist is empty",
    emptyWatchlistSub: "Movies and TV shows you add will appear here.",
    findMoviesBtn: "Find Movies to Watch",
    rated: "Rated",
    saveError: "Failed to save profile changes",
    avatarError: "Failed to update profile picture",
    profileNotFound: "Profile Not Found",
    profileNotFoundDesc:
      "The user you're looking for doesn't exist or is unavailable.",
    noLogsYet: "No watched movies yet.",
    noWatchedYet: "No watched movies yet.",
    noWatchlistYet: "Your watchlist is empty.",
    noLogsYetOthers: "No watched movies yet.",
    noWatchedYetOthers: "No watched movies yet.",
    noWatchlistYetOthers: "This user's watchlist is empty.",
    noReviewsYetOthers: "This user has not written any reviews yet.",
    favoriteGenres: "Favorite Genres",
    topRatedFilms: "Top Rated Films",
    markWatched: "Mark Watched",
    writeReview: "Write Review",
    editReview: "Edit Review",
    planToWatch: "Plan to Watch",
    reviewed: "Reviewed",
    watchlistEmptyTitle: "Watchlist is empty",
    watchlistEmptySub: "Search for movies and add them here.",
    emptyWatchedTitle: "No watched movies yet.",
    emptyWatchedSub: "Mark movies you have watched in the watchlist tab.",
    emptyReviewsTitle: "No reviews written yet.",
    emptyReviewsSub: "Write reviews for movies you have watched.",
    signOutConfirmMessage:
      "You will be signed out of your account. You can log back in at any time.",
    deleteAccountConfirmTitle: "Delete Account?",
    deleteAccountConfirmDesc:
      "This action cannot be undone. All your data including watchlist and watched history will be permanently deleted.",
    deleteAccountConfirmLabel: "Delete Account",
    watchNow: "Watch Now",
    myList: "My List",
    statusWatched: "Watched",
    statusPlanToWatch: "Plan to Watch",
    statusReviewed: "Reviewed",
    markUnwatched: "Mark as unwatched",
    removeFromWatchlistLabel: "Remove from watchlist",
    sortAdded: "Added",
    sortRating: "Rating",
    sortRelease: "Release",
    sortTitle: "Title",
    sort: "Sort",

    // Favorites
    favoritesSection: "❤️ Favorites",
    favoritesEmpty: "No favorite movies yet.\nAdd from the movie detail page!",
    favoritesEdit: "Edit",
    favoritesDone: "Done",

    // Activity Heatmap
    activityTitle: "Activity",
    activityNoLogs: "No activity on this day",
    activityFilmsWatched: "films watched",
    activityFew: "Few",
    activityMany: "Many",
    loginToSeeActivity: "Log in to see friends' activity",
    failedToLoad: "Failed to load content",
    checkConnection: "Please check your internet connection",
    tryAgain: "Try Again",

    // Toasts & Alerts (runtime feedback)
    errorTitle: "Error",
    failedTitle: "Failed",
    successTitle: "Success",
    genericError: "Something went wrong. Please try again.",

    // Screen-level error boundary
    screenErrorTitle: "Something went wrong",
    screenErrorMessage: "An error occurred while loading this {screen}. Try reloading or contact support if the problem continues.",
    screenFallbackName: "page",
    screenNameHome: "Home",
    screenNameProfile: "Profile",
    screenNameSearch: "Search",
    screenNameWatchlist: "Watchlist",
    screenNameMovieDetail: "Movie Detail",
    screenNameUserProfile: "User Profile",
    toastAddedToWatchlist: "Added to Watchlist",
    toastRemovedFromWatchlist: "Removed from Watchlist",
    undo: "Undo",
    toastRestored: "Restored",
    toastLoginToLog: "You must be logged in to log a movie.",
    toastLogSaved: "Movie log saved successfully!",
    toastLogSaveFailed: "An error occurred while saving your log.",
    toastLogDeleted: "Log deleted successfully.",
    toastLogDeleteFailed: "Could not delete log.",
    toastReviewAdded: "Review added!",
    toastCommentAdded: "Comment added successfully!",
    toastMaxFavorites: "Maximum of 20 favorite titles",
    toastAddedToFavorites: "Added to Favorites ❤️",
    toastRemovedFromFavorites: "Removed from Favorites",
    toastAddFavoriteFailed: "Failed to add favorite",
    markWatchedFailed: "Failed to mark as watched.",
    logSaveFailedConnection: "Failed to save log. Please check your connection or profile.",
    exportFailedTitle: "Export Failed",
    exportFailedMsg: "An error occurred while exporting your data.",
    shareMovieMessage: 'Check out "{title}" on WatchlistID! ⭐ {rating}/10',
    shareProfileMessage: "Check out {username}'s profile on WatchlistID! {url}",
    shareProfileTitle: "{username}'s Profile — WatchlistID",
    linkCopied: "Link copied!",
  },

  id: {
    // General
    cancel: "Batal",
    save: "Simpan",
    delete: "Hapus",
    close: "Tutup",
    loading: "Memuat...",
    none: "Tidak ada",
    ok: "OK",
    goBack: "Kembali",
    readLess: "Sembunyikan",
    continue: "Lanjutkan",

    // Auth
    authTagline: "Semesta film pribadimu",
    signIn: "Masuk",
    welcomeBack: "Selamat datang kembali 👋",
    email: "Email",
    password: "Kata Sandi",
    forgotPassword: "Lupa kata sandi?",
    orContinueWith: "Atau masuk dengan",
    google: "Google",
    noAccount: "Belum punya akun?",
    signUpNow: "Daftar sekarang",
    emailPasswordRequired: "Email dan password wajib diisi.",
    signUp: "Daftar",
    joinCommunity: "Bergabung dengan komunitas film kami ✨",
    username: "Nama Pengguna",
    confirmPassword: "Konfirmasi Kata Sandi",
    createAccount: "Buat Akun",
    orSignUpWith: "Atau daftar dengan",
    alreadyHaveAccount: "Sudah punya akun?",
    signInHere: "Masuk di sini",
    allFieldsRequired: "Semua field wajib diisi.",
    passwordsDontMatch: "Password dan konfirmasi tidak cocok.",
    passwordTooShort: "Password minimal 6 karakter.",
    accountCreated: "Akun Berhasil Dibuat!",
    checkEmailVerification:
      "Silakan cek email Anda untuk verifikasi akun sebelum masuk.",
    backToLogin: "Kembali ke Login",
    forgotPasswordTitle: "Lupa Password?",
    forgotPasswordDesc:
      "Masukkan email akun kamu. Kami akan kirimkan link untuk reset password.",
    emailSent: "Email Terkirim!",
    checkInboxForReset: "Cek inbox kamu di {email} untuk link reset password.",
    emailRequired: "Email wajib diisi.",
    or: "atau",
    createNewAccount: "Buat akun baru",
    skipAndExplore: "Lewati & Jelajahi Film →",
    resetPassword: "Atur Ulang Kata Sandi",
    resetPasswordTitle: "Kata Sandi Baru",
    resetPasswordSub: "Masukkan kata sandi baru minimal 8 karakter.",
    confirmNewPassword: "Konfirmasi Password Baru",
    savePassword: "Simpan Password",
    successResetTitle: "Berhasil!",
    successResetMsg:
      "Password Anda telah diperbarui. Mengalihkan Anda ke halaman utama...",
    newPasswordSameAsOldErr:
      "Password baru tidak boleh sama dengan password lama.",
    recoverySessionExpiredErr:
      "Sesi pemulihan tidak valid atau telah kedaluwarsa. Silakan minta tautan baru.",
    resetPasswordSystemErr:
      "Terjadi kesalahan sistem saat mengatur ulang kata sandi.",

    // Profile / Settings
    settings: "Pengaturan",
    diary: "Ditonton",
    reviews: "Ulasan",
    rating: "Rating",
    notifications: "Notifikasi",
    exportWatchlist: "Ekspor Watchlist",
    about: "WatchlistID",
    aboutNav: "Tentang",
    collapseSidebar: "Ciutkan menu samping",
    expandSidebar: "Lebarkan menu samping",
    language: "Bahasa",
    signOut: "Keluar",
    total: "Total",
    watched: "Ditonton",
    toWatch: "Akan Ditonton",
    memberSince: "Anggota sejak",
    shareProfile: "Bagikan Profil",
    share: "Bagikan",
    editProfile: "Edit Profil",
    tapToAddBio: "Ketuk ✏️ untuk menambah bio",
    shortBioPlaceholder: "Tulis bio singkat…",
    yourNamePlaceholder: "Nama Anda",
    nameLabel: "Nama",
    bioLabel: "Bio",

    // Social
    followers: "Pengikut",
    following: "Mengikuti",
    follow: "Ikuti",
    unfollow: "Batal Ikuti",
    noUsersFound: "Pengguna tidak ditemukan",
    noUsersFoundSub: "Coba cari username lainnya",
    findYourFriends: "Temukan temanmu",
    findYourFriendsSub: "Cari pencinta film lainnya menggunakan username",
    viewProfile: "Lihat Profil",
    searchUserPlaceholder: "Cari nama atau username...",
    searchUsers: "Cari Pengguna",
    usersTab: "Pengguna",
    activityFeedEmpty: "Belum ada aktivitas",
    activityFeedEmptySub: "Ikuti teman untuk melihat apa yang mereka tonton!",
    findFriends: "Cari Teman",
    watchedLabel: "Menonton",
    agoMin: "{n} mnt lalu",
    agoHour: "{n} jam lalu",
    agoDay: "{n} hari lalu",

    // Diary / Log Modal
    emptyDiary: "Belum ada film yang ditonton.",
    emptyWatched: "Belum ada film yang ditonton.",
    emptyToWatch: "Daftar tontonan kamu masih kosong.",
    logMovie: "Catat Film",
    logShow: "Catat Serial",
    watchedOn: "Ditonton pada",
    yourRating: "Nilai Kamu",
    ratingHintDefault: "Pilih nilai untuk film ini",
    reviewOptional: "Ulasan (Opsional)",
    reviewPlaceholder: "Tulis ulasan, pikiran, atau perasaanmu...",
    today: "Hari ini",
    preview: "Pratinjau",
    previewPlaceholder: "Ketik sesuatu untuk melihat pratinjau...",
    starsOutOf5: "{n} / 5 bintang",

    // Modals
    signOutConfirmTitle: "Keluar?",
    signOutConfirmDesc: "Apakah kamu yakin ingin keluar dari akunmu?",
    deleteLogTitle: "Hapus Entri Tontonan?",
    deleteLogDesc:
      "Apakah kamu yakin ingin menghapus ini dari daftar Ditonton kamu? Tindakan ini tidak dapat dibatalkan.",
    changePassword: "Ganti Password",
    passwordChangedSuccess: "Password berhasil diubah!",
    newPassword: "Password Baru",
    min8Chars: "Minimal 8 karakter",
    repeatNewPassword: "Ulangi password baru",
    passwordMin8Err: "Password harus minimal 8 karakter.",
    passwordsMismatchErr: "Password tidak cocok. Coba lagi.",

    // Spoilers
    containsSpoiler: "Mengandung Spoiler",
    spoilerDesc:
      "Sembunyikan ulasanmu di balik peringatan untuk melindungi orang lain dari bocoran cerita.",
    clickToReveal: "Ulasan mengandung spoiler. Klik untuk melihat.",
    hideSpoilers: "Sembunyikan Spoiler",

    // Language Names
    english: "English",
    indonesian: "Bahasa Indonesia",

    // Tabs
    tabHome: "Beranda",
    tabDiscover: "Temukan",
    tabWatchlist: "Watchlist",
    tabProfile: "Profil",

    // Home
    trendingMovies: "Film Sedang Tren",
    trendingShows: "Serial Sedang Tren",
    popular: "Populer",
    topRatedMovies: "Film Rating Tertinggi",
    topRatedShows: "Serial Rating Tertinggi",
    recentlyViewed: "Baru Saja Dilihat",
    seeAll: "Lihat Semua",
    browse: "Telusuri",
    browseSub: "Temukan film & serial TV terbaik dan terbaru",
    browseByGenre: "Telusuri berdasarkan Genre",

    // Genres
    genreAction: "Aksi",
    genreComedy: "Komedi",
    genreDrama: "Drama",
    genreHorror: "Horor",
    genreSciFi: "Sci-Fi",
    genreRomance: "Romantis",
    genreAdventure: "Petualangan",
    genreCrime: "Kriminal",
    genreThriller: "Thriller",
    genreFantasy: "Fantasi",
    genreMystery: "Misteri",
    genreFamily: "Keluarga",
    genreDocumentary: "Dokumenter",

    // Discover / Search
    searchPlaceholder: "Cari film, serial, aktor...",
    discoverTitle: "Eksplor",
    discoverSub: "Cari film, serial, dan aktor favoritmu",
    noResults: "Tidak ada hasil",
    tryAnother: "Coba kata kunci lain.",
    recent: "Terakhir Dicari",
    clearAll: "Hapus Semua",
    trendingSearches: "Pencarian Terpopuler",
    trendingNow: "Sedang Tren",
    trendingToday: "Tren Hari Ini",
    trendingTV: "Serial TV Populer",
    loadMore: "Muat Lebih Banyak",
    pageOf: "Halaman {page} dari {total}",
    actor: "Aktor",
    catPopularOn: "Populer di WATCHLISTID",
    catTrendingMoviesSub: "Apa yang sedang ditonton dunia saat ini",
    catTrendingTVSub: "Serial paling banyak ditonton minggu ini",
    catPopularSub: "Paling dicintai oleh komunitas kami",
    catTopRatedMoviesSub: "Film dengan pujian kritis sepanjang masa",
    catTopRatedTVSub: "Serial TV terbaik yang pernah dibuat",
    filterAll: "Semua",
    filterMovies: "Film",
    filterTV: "Serial TV",
    filterAnime: "Anime",
    filterAnimation: "Animasi",
    searchIn: "Cari di {category}…",
    searchMoviesTVPeople: "Film, serial TV, aktor…",
    showingResults: "Menampilkan {count} dari {total} hasil",
    titlesCount: "{count} judul",
    titles: "judul",
    seasons: "Musim",
    episodeProgress: "Progress: {watched} dari {total} episode",
    seasonCompleted: "Musim Selesai!",
    noEpisodesFound: "Episode tidak ditemukan",
    noEpisodesFoundSub: "Episode untuk musim ini belum tersedia.",

    // Movie Details
    imdbRating: "RATING IMDB",
    popularity: "POPULARITAS",
    yourRatingLabel: "NILAI KAMU",
    log: "Catat",
    playTrailer: "Putar Trailer",
    inWatchlist: "Di Watchlist",
    addToWatchlist: "Tambah ke Watchlist",
    videos: "Video",
    videosCount: "{count} video",
    storyline: "Alur Cerita",
    readMore: "Baca selengkapnya",
    less: "Sembunyikan",
    topCast: "Pemeran Utama",
    details: "Detail",
    userReviews: "Ulasan Pengguna",
    moreLikeThis: "Serupa",
    votes: "suara",
    preparingExperience: "Menyiapkan pengalaman...",
    contentNotFound: "Ups! Konten tidak ditemukan",
    contentNotFoundDesc:
      "Kami tidak dapat mengambil detail untuk judul ini. Mungkin tidak tersedia atau ada masalah koneksi.",

    // Person Details
    born: "Lahir",
    birthplace: "Tempat Lahir",
    biography: "Biografi",
    knownFor: "Dikenal Karena",
    filmography: "Filmografi",

    // Notifications
    markAllRead: "Tandai semua sudah dibaca",
    unread: "belum dibaca",
    justNow: "Baru saja",
    profile: "Profil",
    logs: "Log",
    allCaughtUp: "Semuanya sudah beres!",
    noNotifications: "Kamu tidak memiliki notifikasi baru saat ini.",

    // Metadata Table
    metaGenre: "Genre",
    metaReleaseDate: "Tanggal Rilis",
    metaLanguage: "Bahasa",
    metaStatus: "Status",
    metaBudget: "Anggaran",
    metaRevenue: "Pendapatan",
    metaRuntime: "Durasi",
    metaProduction: "Produksi",
    minutes: "menit",

    // Watchlist
    myWatchlist: "Daftar Tontonan",
    ratedByYou: "telah kamu nilai",
    moviesShowsToWatch: "Film dan serial untuk ditonton",
    emptyWatchlistTitle: "Daftar tontonan kamu masih kosong",
    emptyWatchlistSub:
      "Film dan serial yang kamu tambahkan akan muncul di sini.",
    findMoviesBtn: "Cari Film untuk Ditonton",
    rated: "Dinilai",
    saveError: "Gagal menyimpan perubahan profil",
    avatarError: "Gagal memperbarui foto profil",
    profileNotFound: "Profil Tidak Ditemukan",
    profileNotFoundDesc:
      "Pengguna yang Anda cari tidak ada atau tidak tersedia.",
    noLogsYet: "Belum ada film yang ditonton.",
    noWatchedYet: "Belum ada film yang ditonton.",
    noWatchlistYet: "Daftar tontonan kamu masih kosong.",
    noLogsYetOthers: "Belum ada film yang ditonton oleh pengguna ini.",
    noWatchedYetOthers: "Belum ada film yang ditonton oleh pengguna ini.",
    noWatchlistYetOthers: "Daftar tontonan pengguna ini masih kosong.",
    noReviewsYetOthers: "Pengguna ini belum menulis ulasan.",
    favoriteGenres: "Genre Terfavorit",
    topRatedFilms: "Film Terfavorit",
    markWatched: "Tandai Sudah Ditonton",
    writeReview: "Tulis Ulasan",
    editReview: "Edit Ulasan",
    planToWatch: "Ingin Ditonton",
    reviewed: "Sudah Direview",
    watchlistEmptyTitle: "Watchlist kosong",
    watchlistEmptySub: "Cari film favoritmu dan tambahkan ke sini.",
    emptyWatchedTitle: "Belum ada film yang ditonton.",
    emptyWatchedSub: "Tandai film yang sudah kamu tonton di daftar watchlist.",
    emptyReviewsTitle: "Belum ada ulasan ditulis.",
    emptyReviewsSub: "Tulis ulasan pada film yang sudah ditonton.",
    signOutConfirmMessage:
      "Kamu akan keluar dari akunmu. Kamu bisa login kembali kapan saja.",
    deleteAccountConfirmTitle: "Hapus Akun?",
    deleteAccountConfirmDesc:
      "Tindakan ini tidak bisa dibatalkan. Semua data kamu termasuk watchlist dan daftar tontonan akan dihapus permanen.",
    deleteAccountConfirmLabel: "Hapus Akun",
    watchNow: "Tonton Sekarang",
    myList: "Daftar Saya",
    statusWatched: "Sudah Ditonton",
    statusPlanToWatch: "Ingin Ditonton",
    statusReviewed: "Sudah Direview",
    markUnwatched: "Tandai Belum Ditonton",
    removeFromWatchlistLabel: "Hapus dari daftar tontonan",
    sortAdded: "Ditambahkan",
    sortRating: "Rating",
    sortRelease: "Rilis",
    sortTitle: "Judul",
    sort: "Urutkan",

    // Favorites
    favoritesSection: "❤️ Favorit",
    favoritesEmpty: "Belum ada film favorit.\nTambahkan dari halaman detail film!",
    favoritesEdit: "Atur",
    favoritesDone: "Selesai",

    // Activity Heatmap
    activityTitle: "Aktivitas",
    activityNoLogs: "Tidak ada aktivitas hari ini",
    activityFilmsWatched: "film ditonton",
    activityFew: "Sedikit",
    activityMany: "Banyak",
    loginToSeeActivity: "Masuk untuk melihat aktivitas teman",
    failedToLoad: "Gagal memuat konten",
    checkConnection: "Periksa koneksi internet kamu",
    tryAgain: "Coba Lagi",

    // Toasts & Alerts (runtime feedback)
    errorTitle: "Kesalahan",
    failedTitle: "Gagal",
    successTitle: "Berhasil",
    genericError: "Terjadi kesalahan. Silakan coba lagi.",

    // Screen-level error boundary
    screenErrorTitle: "Waduh, ada kendala!",
    screenErrorMessage: "Terjadi kesalahan saat memuat {screen} ini. Coba muat ulang atau hubungi tim support jika kendala berlanjut.",
    screenFallbackName: "halaman",
    screenNameHome: "Beranda",
    screenNameProfile: "Profil",
    screenNameSearch: "Pencarian",
    screenNameWatchlist: "Watchlist",
    screenNameMovieDetail: "Detail Film",
    screenNameUserProfile: "Profil Pengguna",
    toastAddedToWatchlist: "Ditambahkan ke Watchlist",
    toastRemovedFromWatchlist: "Dihapus dari Watchlist",
    undo: "Urungkan",
    toastRestored: "Dipulihkan",
    toastLoginToLog: "Kamu harus masuk untuk mencatat film.",
    toastLogSaved: "Catatan film berhasil disimpan!",
    toastLogSaveFailed: "Terjadi kesalahan saat menyimpan catatanmu.",
    toastLogDeleted: "Catatan berhasil dihapus.",
    toastLogDeleteFailed: "Tidak dapat menghapus catatan.",
    toastReviewAdded: "Ulasan ditambahkan!",
    toastCommentAdded: "Komentar berhasil ditambahkan!",
    toastMaxFavorites: "Maksimal 20 judul favorit",
    toastAddedToFavorites: "Ditambahkan ke Favorit ❤️",
    toastRemovedFromFavorites: "Dihapus dari Favorit",
    toastAddFavoriteFailed: "Gagal menambahkan favorit",
    markWatchedFailed: "Gagal menandai sebagai sudah ditonton.",
    logSaveFailedConnection: "Gagal menyimpan catatan. Periksa koneksi atau profilmu.",
    exportFailedTitle: "Ekspor Gagal",
    exportFailedMsg: "Terjadi kesalahan saat mengekspor data.",
    shareMovieMessage: 'Lihat "{title}" di WatchlistID! ⭐ {rating}/10',
    shareProfileMessage: "Lihat profil {username} di WatchlistID! {url}",
    shareProfileTitle: "Profil {username} — WatchlistID",
    linkCopied: "Tautan disalin!",
  },
};

type TranslationKey = keyof typeof translations.en;

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
}

// Exported (not just the hook) so class components that can't use hooks —
// e.g. ScreenErrorBoundary — can read it via `static contextType`.
export const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>("en");

  // Load saved language on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem("app_language");
        if (savedLang === "en" || savedLang === "id") {
          setLanguageState(savedLang);
        }
      } catch (error) {
        console.error("Error loading language", error);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem("app_language", lang);
    } catch (error) {
      console.error("Error saving language", error);
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations["en"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    console.warn(
      "[useLanguage] useLanguage was called outside of a LanguageProvider! Returning fallback en translations.",
    );
    return {
      language: "en" as Language,
      setLanguage: async (lang: Language) => {},
      t: (key: TranslationKey): string => {
        return translations["en"][key] || key;
      },
    };
  }
  return context;
};

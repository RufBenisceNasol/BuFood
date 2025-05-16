import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { store as storeApi } from '../api';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  InputBase,
  Paper,
  Rating,
  Chip,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  Search
} from '@mui/icons-material';

const StoresPage = () => {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStores(stores);
    } else {
      const filtered = stores.filter(store => 
        store.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredStores(filtered);
    }
  }, [searchQuery, stores]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const storesData = await storeApi.getAllStores();
      setStores(storesData || []);
      setFilteredStores(storesData || []);
      setError('');
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError('Failed to load stores. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/customer/home');
  };

  const navigateToStore = (storeId) => {
    navigate(`/customer/store/${storeId}`);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#FF8C00' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton 
          onClick={handleGoBack}
          sx={{ mr: 2 }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" 
          sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #FF8C00 30%, #FF6B00 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Explore Stores
        </Typography>
      </Box>

      <Paper
        elevation={2}
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          mb: 4,
          borderRadius: 2
        }}
      >
        <IconButton sx={{ p: '10px' }}>
          <Search />
        </IconButton>
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search stores..."
          value={searchQuery}
          onChange={handleSearch}
        />
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {filteredStores.length > 0 ? (
          filteredStores.map(store => (
            <Grid item xs={12} sm={6} md={4} key={store._id}>
              <Card 
                onClick={() => navigateToStore(store._id)}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 20px rgba(255, 140, 0, 0.2)'
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="160"
                  image={store.bannerImage || 'https://placehold.co/600x400/orange/white?text=Store'}
                  alt={store.storeName}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {store.storeName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {store.description ? 
                      (store.description.length > 80 ? 
                        `${store.description.substring(0, 80)}...` : 
                        store.description) : 
                      'No description available'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating 
                      value={store.rating || 0} 
                      readOnly 
                      precision={0.5}
                      size="small"
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: '#FFD700',
                        }
                      }}
                    />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {store.rating || '0'}
                    </Typography>
                  </Box>
                  
                  {store.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOn sx={{ color: '#FF5722', mr: 0.5, fontSize: '1rem' }} />
                      <Typography variant="body2">
                        {store.location}
                      </Typography>
                    </Box>
                  )}
                  
                  {store.tags && store.tags.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {store.tags.slice(0, 3).map(tag => (
                        <Chip 
                          key={tag} 
                          label={tag}
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(255, 140, 0, 0.1)', 
                            color: '#FF8C00',
                            fontWeight: 'medium'
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Box sx={{ 
            width: '100%', 
            textAlign: 'center', 
            py: 5 
          }}>
            <Typography variant="h6" color="text.secondary">
              No stores found. Try a different search.
            </Typography>
          </Box>
        )}
      </Grid>
    </Container>
  );
};

export default StoresPage;
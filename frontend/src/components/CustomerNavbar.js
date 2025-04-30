import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { cart } from '../api';
import {
    AppBar,
    Toolbar,
    IconButton,
    Badge,
    Box,
    Menu,
    MenuItem,
    InputBase,
    styled,
    alpha
} from '@mui/material';
import {
    ShoppingCart,
    AccountCircle,
    Search as SearchIcon,
    ArrowBack
} from '@mui/icons-material';

const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: '50px',
    backgroundColor: alpha('#fff', 0.15),
    '&:hover': {
        backgroundColor: alpha('#fff', 0.25),
    },
    marginRight: 2,
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        marginLeft: 3,
        width: 'auto',
    },
    border: '1px solid rgba(255, 255, 255, 0.3)',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    width: '100%',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        [theme.breakpoints.up('md')]: {
            width: '20ch',
        },
    },
}));

const CustomerNavbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [cartItemCount, setCartItemCount] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const [user, setUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    }, []);

    useEffect(() => {
        fetchCartCount();
    }, [location]);

    const fetchCartCount = async () => {
        try {
            const cartData = await cart.viewCart();
            setCartItemCount(cartData.items.reduce((acc, item) => acc + item.quantity, 0));
        } catch (err) {
            console.error('Failed to fetch cart:', err);
        }
    };

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            // Implement search functionality
            console.log('Search:', searchQuery);
        }
    };

    const goBack = () => {
        navigate(-1);
    };

    return (
        <AppBar 
            position="fixed" 
            sx={{ 
                background: 'linear-gradient(45deg, #FF8C00 30%, #FF6B00 90%)',
                boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)'
            }}
        >
            <Toolbar>
                {location.pathname !== '/home' && (
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={goBack}
                        sx={{ mr: 2 }}
                    >
                        <ArrowBack />
                    </IconButton>
                )}

                <Link 
                    to="/home" 
                    style={{ 
                        color: 'white', 
                        textDecoration: 'none', 
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        flexGrow: location.pathname === '/home' ? 0 : 1
                    }}
                >
                    BuFood
                </Link>

                {location.pathname === '/home' && (
                    <Search>
                        <SearchIconWrapper>
                            <SearchIcon />
                        </SearchIconWrapper>
                        <StyledInputBase
                            placeholder="Search food..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleSearch}
                        />
                    </Search>
                )}

                <Box sx={{ flexGrow: 1 }} />

                <IconButton
                    color="inherit"
                    component={Link}
                    to="/cart"
                    sx={{ mr: 2 }}
                >
                    <Badge badgeContent={cartItemCount} color="error">
                        <ShoppingCart />
                    </Badge>
                </IconButton>

                <IconButton
                    size="large"
                    onClick={handleMenu}
                    color="inherit"
                >
                    <AccountCircle />
                </IconButton>
                
                <Menu
                    anchorEl={anchorEl}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    <MenuItem disabled>{user?.name}</MenuItem>
                    <MenuItem component={Link} to="/orders" onClick={handleClose}>
                        My Orders
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
};

export default CustomerNavbar;
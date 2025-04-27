import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Badge,
    Box,
    Menu,
    MenuItem,
} from '@mui/material';
import { ShoppingCart, AccountCircle } from '@mui/icons-material';
import { cart } from '../api';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [cartItemCount, setCartItemCount] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    }, []);

    useEffect(() => {
        if (user?.role === 'Customer') {
            fetchCartCount();
        }
    }, [user, location]);

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

    // Don't show navbar on splash, login, and register pages
    if (['/login', '/register', '/'].includes(location.pathname)) {
        return null;
    }

    return (
        <AppBar position="sticky">
            <Toolbar>
                {user?.role === 'Seller' ? (
                    <Typography
                        variant="h6"
                        component={Link}
                        to="/seller/dashboard"
                        sx={{ color: 'white', textDecoration: 'none', flexGrow: 1 }}
                    >
                        BuFood Seller
                    </Typography>
                ) : (
                    <Typography
                        variant="h6"
                        component={Link}
                        to="/home"
                        sx={{ color: 'white', textDecoration: 'none', flexGrow: 1 }}
                    >
                        BuFood
                    </Typography>
                )}

                {user?.role === 'Customer' && (
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
                )}

                {user ? (
                    <Box>
                        <IconButton
                            size="large"
                            onClick={handleMenu}
                            color="inherit"
                        >
                            <AccountCircle />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            <MenuItem disabled>{user.name}</MenuItem>
                            {user.role === 'Customer' && (
                                <MenuItem onClick={() => navigate('/orders')}>My Orders</MenuItem>
                            )}
                            <MenuItem onClick={handleLogout}>Logout</MenuItem>
                        </Menu>
                    </Box>
                ) : (
                    <Button color="inherit" component={Link} to="/login">
                        Login
                    </Button>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
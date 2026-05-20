"""
Authentication routes for login, register, token refresh, and logout.
"""
from flask import Blueprint, request, jsonify, make_response
from backend.extensions import db
from backend.models import User
from .jwt_utils import jwt_manager
from .decorators import token_required
from backend.utils.validation import (
    sanitize_input,
    validate_email,
    validate_full_name,
    validate_input,
    validate_password_strength,
    validate_role,
    validate_username,
)

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

ALLOWED_ROLES = {'farmer', 'buyer', 'equipment', 'grocery', 'expert', 'admin', 'shopkeeper'}


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user.
    
    Request Body:
        {
            "username": "farmer123",
            "email": "farmer@example.com",
            "password": "SecurePass123",
            "full_name": "John Doe",
            "role": "farmer",
            "phone": "1234567890",
            "location": "Maharashtra"
        }
    
    Returns:
        201: User created successfully
        400: Validation error
        409: User already exists
    """
    try:
        data = request.get_json(silent=True)

        is_valid, message = validate_input(data, ['username', 'email', 'password', 'full_name', 'role'])
        if not is_valid:
            return jsonify({'status': 'error', 'message': message}), 400

        username = sanitize_input(data['username'], 30)
        email = sanitize_input(data['email'], 254).lower()
        password = data['password'] if isinstance(data['password'], str) else ''
        full_name = sanitize_input(data['full_name'], 100)
        role = sanitize_input(data['role'], 30).lower()
        phone = sanitize_input(data.get('phone', ''), 20)
        location = sanitize_input(data.get('location', ''), 100)

        is_valid, message = validate_username(username)
        if not is_valid:
            return jsonify({'status': 'error', 'message': message}), 400

        is_valid, message = validate_email(email, gmail_only=True)
        if not is_valid:
            return jsonify({'status': 'error', 'message': message}), 400

        is_valid, message = validate_full_name(full_name)
        if not is_valid:
            return jsonify({'status': 'error', 'message': message}), 400

        is_valid, message = validate_password_strength(password, min_length=8, require_special=False)
        if not is_valid:
            return jsonify({'status': 'error', 'message': message}), 400

        is_valid, normalized_role = validate_role(role, ALLOWED_ROLES)
        if not is_valid:
            return jsonify({'status': 'error', 'message': 'Invalid role selected'}), 400

        role = normalized_role
        
        # Check if user exists
        existing = User.query.filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing:
            return jsonify({
                'status': 'error',
                'message': 'User with this username or email already exists'
            }), 409
        
        # Create user
        new_user = User(
            username=username,
            email=email,
            full_name=full_name,
            role=role,
            phone=phone,
            location=location
        )
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'User registered successfully',
            'user': new_user.to_dict()
        }), 201
        
    except ValueError as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': f'Registration failed: {str(e)}'
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate user and return tokens.
    
    Request Body:
        {
            "username": "farmer123",  # or email
            "password": "SecurePass123"
        }
    
    Returns:
        200: Login successful with access token (refresh token in HTTPOnly cookie)
        401: Invalid credentials
    """
    try:
        data = request.get_json(silent=True)

        is_valid, message = validate_input(data, ['username', 'password'])
        if not is_valid:
            return jsonify({'status': 'error', 'message': message}), 400

        username_or_email = sanitize_input(data['username'], 254)
        password = data['password'] if isinstance(data['password'], str) else ''

        if not username_or_email or not password:
            return jsonify({
                'status': 'error',
                'message': 'Username/email and password required'
            }), 400

        if '@' in username_or_email:
            is_valid, message = validate_email(username_or_email, gmail_only=False)
            if not is_valid:
                return jsonify({'status': 'error', 'message': message}), 400
        
        # Find user
        user = User.query.filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        ).first()
        
        if not user or not user.check_password(password):
            return jsonify({
                'status': 'error',
                'message': 'Invalid username/email or password'
            }), 401
        
        # Update last login
        user.update_last_login()
        db.session.commit()
        
        # Generate tokens
        access_token = jwt_manager.generate_access_token(
            user_id=user.id,
            username=user.username,
            role=user.role
        )
        refresh_token = jwt_manager.generate_refresh_token(user_id=user.id)
        
        # Create response with HTTPOnly cookie
        response = make_response(jsonify({
            'status': 'success',
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }))
        
        # Set refresh token in secure HTTPOnly cookie
        response.set_cookie(
            'refresh_token',
            refresh_token,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite='Lax',
            max_age=30*24*60*60  # 30 days
        )
        
        return response, 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Login failed: {str(e)}'
        }), 500


@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """
    Refresh access token using refresh token from cookie.
    
    Returns:
        200: New access token
        401: Invalid or missing refresh token
    """
    try:
        refresh_token = jwt_manager.extract_refresh_token_from_cookie()
        
        if not refresh_token:
            return jsonify({
                'status': 'error',
                'message': 'Refresh token missing'
            }), 401
        
        is_valid, result = jwt_manager.validate_refresh_token(refresh_token)
        
        if not is_valid:
            return jsonify({
                'status': 'error',
                'message': result
            }), 401
        
        user_id = result.get('user_id')
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'User not found'
            }), 401
        
        # Generate new access token
        new_access_token = jwt_manager.generate_access_token(
            user_id=user.id,
            username=user.username,
            role=user.role
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Token refreshed successfully',
            'access_token': new_access_token
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Token refresh failed: {str(e)}'
        }), 500


@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """
    Logout user by clearing refresh token cookie.
    
    Returns:
        200: Logout successful
    """
    response = make_response(jsonify({
        'status': 'success',
        'message': 'Logout successful'
    }))
    
    # Clear refresh token cookie
    response.set_cookie(
        'refresh_token',
        '',
        httponly=True,
        secure=False,
        samesite='Lax',
        max_age=0
    )
    
    return response, 200


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """
    Get current authenticated user information.
    
    Returns:
        200: User information
    """
    user = User.query.get(current_user['user_id'])
    
    if not user:
        return jsonify({
            'status': 'error',
            'message': 'User not found'
        }), 404
    
    return jsonify({
        'status': 'success',
        'user': user.to_dict()
    }), 200


@auth_bp.route('/validate', methods=['GET'])
@token_required
def validate_token(current_user):
    """
    Validate access token.
    
    Returns:
        200: Token is valid
    """
    return jsonify({
        'status': 'success',
        'message': 'Token is valid',
        'user': {
            'id': current_user['user_id'],
            'username': current_user['username'],
            'role': current_user['role']
        }
    }), 200

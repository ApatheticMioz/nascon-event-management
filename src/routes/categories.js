const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { isAuthenticated, hasPrivilege } = require('../middleware/auth');

// GET /categories - Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await executeQuery(`
            SELECT c.*, 
                   p.CategoryName as ParentCategoryName,
                   COUNT(e.EventID) as EventCount
            FROM EventCategories c
            LEFT JOIN EventCategories p ON c.ParentCategoryID = p.CategoryID
            LEFT JOIN Events e ON c.CategoryID = e.CategoryID
            GROUP BY c.CategoryID
            ORDER BY c.CategoryName ASC
        `);

        res.render('categories', {
            title: 'Event Categories',
            categories: categories,
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading categories',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// GET /categories/add - Show add category form
router.get('/add', isAuthenticated, hasPrivilege('categories', 'create'), async (req, res) => {
    try {
        const categories = await executeQuery('SELECT CategoryID, CategoryName FROM EventCategories');
        res.render('category-form', {
            title: 'Add Category',
            categories: categories,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error loading category form:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading form',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// POST /categories/add - Create new category
router.post('/add', isAuthenticated, hasPrivilege('categories', 'create'), async (req, res) => {
    try {
        const { categoryName, description, parentCategoryId } = req.body;

        // Check if category name already exists
        const existingCategory = await executeQuery(
            'SELECT CategoryID FROM EventCategories WHERE CategoryName = ?',
            [categoryName]
        );

        if (existingCategory.length > 0) {
            return res.status(400).json({
                error: 'Category name already exists'
            });
        }

        const result = await executeQuery(`
            INSERT INTO EventCategories (CategoryName, Description, ParentCategoryID)
            VALUES (?, ?, ?)
        `, [categoryName, description, parentCategoryId || null]);

        res.status(201).json({
            message: 'Category created successfully',
            categoryId: result.insertId
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /categories/edit/:id - Show edit category form
router.get('/edit/:id', isAuthenticated, hasPrivilege('categories', 'update'), async (req, res) => {
    try {
        const [category] = await executeQuery(`
            SELECT c.*, p.CategoryName as ParentCategoryName
            FROM EventCategories c
            LEFT JOIN EventCategories p ON c.ParentCategoryID = p.CategoryID
            WHERE c.CategoryID = ?
        `, [req.params.id]);

        if (!category) {
            return res.status(404).render('error', {
                title: 'Error',
                message: 'Category not found',
                error: {}
            });
        }

        const categories = await executeQuery(`
            SELECT CategoryID, CategoryName 
            FROM EventCategories 
            WHERE CategoryID != ?
        `, [req.params.id]);

        res.render('category-form', {
            title: 'Edit Category',
            category: category,
            categories: categories,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error loading category form:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading form',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// PUT /categories/:id - Update category
router.put('/:id', isAuthenticated, hasPrivilege('categories', 'update'), async (req, res) => {
    try {
        const { categoryName, description, parentCategoryId } = req.body;

        // Check if category name already exists (excluding current category)
        const existingCategory = await executeQuery(
            'SELECT CategoryID FROM EventCategories WHERE CategoryName = ? AND CategoryID != ?',
            [categoryName, req.params.id]
        );

        if (existingCategory.length > 0) {
            return res.status(400).json({
                error: 'Category name already exists'
            });
        }

        // Prevent circular references
        if (parentCategoryId === req.params.id) {
            return res.status(400).json({
                error: 'Category cannot be its own parent'
            });
        }

        const result = await executeQuery(`
            UPDATE EventCategories
            SET CategoryName = ?, Description = ?, ParentCategoryID = ?
            WHERE CategoryID = ?
        `, [categoryName, description, parentCategoryId || null, req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /categories/:id - Delete category
router.delete('/:id', isAuthenticated, hasPrivilege('categories', 'delete'), async (req, res) => {
    try {
        // Check if category has events
        const events = await executeQuery(
            'SELECT COUNT(*) as count FROM Events WHERE CategoryID = ?',
            [req.params.id]
        );

        if (events[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete category with associated events'
            });
        }

        // Check if category has subcategories
        const subcategories = await executeQuery(
            'SELECT COUNT(*) as count FROM EventCategories WHERE ParentCategoryID = ?',
            [req.params.id]
        );

        if (subcategories[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete category with subcategories'
            });
        }

        const result = await executeQuery(
            'DELETE FROM EventCategories WHERE CategoryID = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/categories - Get all categories for API
router.get('/api/categories', async (req, res) => {
    try {
        const categories = await executeQuery(`
            SELECT c.*, 
                   p.CategoryName as ParentCategoryName,
                   COUNT(e.EventID) as EventCount
            FROM EventCategories c
            LEFT JOIN EventCategories p ON c.ParentCategoryID = p.CategoryID
            LEFT JOIN Events e ON c.CategoryID = e.CategoryID
            GROUP BY c.CategoryID
            ORDER BY c.CategoryName ASC
        `);
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 
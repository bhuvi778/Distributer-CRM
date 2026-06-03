import { buildRoleFilter } from './roleFilters.js';
import { userCanDelete } from './userPermissions.js';

const createCRUD = (Model, populateFields = [], resourceName = null) => ({
  getAll: async (req, res) => {
    try {
      const filter = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.route) filter.route = req.query.route;
      if (req.query.outlet) filter.outlet = req.query.outlet;
      if (req.query.salesRep) filter.salesRep = req.query.salesRep;
      if (req.query.type) filter.type = req.query.type;
      if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

      if (resourceName) {
        const roleFilter = await buildRoleFilter(req.user, resourceName);
        Object.assign(filter, roleFilter);
      }

      let query = Model.find(filter).sort('-createdAt');
      populateFields.forEach((f) => { query = query.populate(f); });
      const items = await query;
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getOne: async (req, res) => {
    try {
      let query = Model.findById(req.params.id);
      populateFields.forEach((f) => { query = query.populate(f); });
      const item = await query;
      if (!item) return res.status(404).json({ message: 'Not found' });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const item = await Model.create(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!item) return res.status(404).json({ message: 'Not found' });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  remove: async (req, res) => {
    try {
      if (!userCanDelete(req.user)) {
        return res.status(403).json({ message: 'You do not have permission to delete records' });
      }
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
});

export default createCRUD;

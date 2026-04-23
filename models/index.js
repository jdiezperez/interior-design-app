const User = require('./User');
const Location = require('./Location');
const StyleCategory = require('./StyleCategory');
const FurnitureCategory = require('./FurnitureCategory');
const Style = require('./Style');
const StyleImage = require('./StyleImage');
const Furniture = require('./Furniture');
const FurnitureImage = require('./FurnitureImage');
const ProjectCategory = require('./ProjectCategory');
const Project = require('./Project');
const ProjectImage = require('./ProjectImage');

// User & Team Associations
User.hasMany(User, { as: 'members', foreignKey: 'parentId' });
User.belongsTo(User, { as: 'parent', foreignKey: 'parentId' });

User.hasMany(Location, { foreignKey: 'userId', as: 'locations' });
Location.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

Location.hasMany(User, { foreignKey: 'locationId', as: 'members' });
User.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });

// Style Associations
StyleCategory.hasMany(Style, { foreignKey: 'styleCategoryId', onDelete: 'CASCADE' });
Style.belongsTo(StyleCategory, { foreignKey: 'styleCategoryId' });

Style.hasMany(StyleImage, { foreignKey: 'styleId', onDelete: 'CASCADE' });
StyleImage.belongsTo(Style, { foreignKey: 'styleId' });

// Furniture Associations
FurnitureCategory.hasMany(Furniture, { foreignKey: 'furnitureCategoryId', as: 'furnitures', onDelete: 'CASCADE' });
Furniture.belongsTo(FurnitureCategory, { foreignKey: 'furnitureCategoryId', as: 'category' });

Furniture.hasMany(FurnitureImage, { foreignKey: 'furnitureId', as: 'images', onDelete: 'CASCADE' });
FurnitureImage.belongsTo(Furniture, { foreignKey: 'furnitureId', as: 'furniture' });

// Project Associations
ProjectCategory.hasMany(Project, { foreignKey: 'projectCategoryId', as: 'projects', onDelete: 'CASCADE' });
Project.belongsTo(ProjectCategory, { foreignKey: 'projectCategoryId', as: 'category' });

Project.hasMany(ProjectImage, { foreignKey: 'projectId', as: 'images', onDelete: 'CASCADE' });
ProjectImage.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// User linkage for Projects (to ensure easy cleanup or querying)
User.hasMany(ProjectCategory, { foreignKey: 'userId', as: 'projectCategories' });
ProjectCategory.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Project, { foreignKey: 'userId', as: 'userProjects' });
Project.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    User,
    Location,
    StyleCategory,
    FurnitureCategory,
    Style,
    StyleImage,
    Furniture,
    FurnitureImage,
    ProjectCategory,
    Project,
    ProjectImage
};

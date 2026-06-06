# .ai Folder - AI Context System

Welcome to the SwiftRide Taxi Backend AI Context System.

This folder contains comprehensive documentation that AI assistants use to understand your project architecture, patterns, conventions, and best practices. It's designed to make future AI-assisted development faster, more consistent, and production-grade.

## 📚 Documentation Files

### 1. **project-overview.md** - START HERE

- Project purpose and business domains
- Tech stack and dependencies
- Architecture overview
- Application flow
- Database connection strategy

**Use when**: Understanding what the project does, how it's structured, tech choices

---

### 2. **folder-structure.md**

- Complete folder structure explanation
- Each folder's responsibility
- Module responsibilities and boundaries
- Architectural boundaries between layers

**Use when**: Navigating codebase, understanding where to put new code, understanding module relationships

---

### 3. **backend-rules.md** - CRITICAL

- Mandatory architecture rules (service-based, thin controllers, repositories)
- SOLID principles application
- Error handling standards
- Validation rules
- Database optimization standards
- Security standards
- Naming conventions
- Scalability rules

**Use when**: Implementing features, reviewing code quality, ensuring consistency

---

### 4. **coding-standards.md**

- Naming conventions (files, functions, classes, variables)
- Import ordering rules
- Formatting patterns and spacing
- Async/await usage patterns
- Comment and documentation standards
- TypeScript strict mode compliance

**Use when**: Writing code, reviewing code style, fixing formatting issues

---

### 5. **api-patterns.md**

- Request/response cycle overview
- Controller structure pattern
- Service layer structure
- Route structure pattern
- Middleware flow and ordering
- Request validation flow
- Response formatting standards
- Pagination/filtering patterns
- Authentication and authorization flows
- Common HTTP status codes

**Use when**: Creating API endpoints, designing request/response formats, implementing authentication

---

### 6. **database-patterns.md**

- MongoDB/Mongoose schema conventions
- Schema best practices (indexes, enums, soft deletes)
- Relationship patterns (references, embedding, many-to-many)
- Query optimization patterns (lean queries, projections, aggregation)
- Transaction patterns with sessions
- Population strategies
- Query anti-patterns to avoid

**Use when**: Designing data models, writing database queries, optimizing performance

---

### 7. **error-handling.md**

- Global error handling architecture
- AppError custom error class
- HTTP status code standards by layer
- Mongoose/database error handling
- Error response formats
- Error message guidelines
- Future error enhancements

**Use when**: Implementing error handling, understanding error flow, handling specific error types

---

### 8. **reusable-components.md**

- Core utilities (ResponseBuilder, AppError, asyncHandler)
- HTTP status constants
- Existing middleware
- Future validators and helpers
- DTOs and types patterns
- Query builders
- Dependency injection patterns
- Shared enums
- Configuration utilities
- Logger utility

**Use when**: Building features, looking for utilities to reuse, implementing validation

---

### 9. **module-map.md**

- Current modules structure
- Complete dependency graph
- Module interactions and data flow
- Cross-module dependencies
- Shared services
- Reusability matrix
- Extension points

**Use when**: Understanding module relationships, adding new modules, refactoring, avoiding circular dependencies

---

### 10. **feature-implementation-guide.md** - IMPLEMENTATION MANUAL

- Step-by-step guide to add new features
- Design & planning phase
- Data layer creation (schema, types, repository)
- Business logic layer (service)
- API layer (controller, routes)
- Testing & validation
- Architecture validation
- Quick checklist
- Common mistakes to avoid

**Use when**: Implementing new features, onboarding new developers, creating modules

---

### 11. **examples/golden-module/** - PRIMARY IMPLEMENTATION REFERENCE

- Definitive module pattern based on the real auth implementation
- Controller, service, route, validation, model, error-handling, and response examples
- Feature blueprint and checklist for building consistent modules

**Use when**: Starting any new backend feature, matching architecture, or checking implementation standards

---

### 12. **refactoring-opportunities.md**

- Current architecture strengths
- Identified technical debt
- Recommended improvements
- Implementation details for each refactoring
- Priority and effort estimates
- Implementation roadmap

**Use when**: Planning improvements, understanding tech debt, making performance optimizations

---

## 🎯 Quick Start for AI Development

### First Time Using These Docs?

1. **Understand the project**: Read [project-overview.md](./project-overview.md)
2. **Understand the structure**: Read [folder-structure.md](./folder-structure.md)
3. **Learn the rules**: Read [backend-rules.md](./backend-rules.md)
4. **Use the reference module**: Read [golden-module](./examples/golden-module/README.md)
5. **Understand your task**: Is it a new feature? Go to [feature-implementation-guide.md](./feature-implementation-guide.md)

### Building a New Feature?

Follow this flow:

1. **Design**: Use design phase in [feature-implementation-guide.md](./feature-implementation-guide.md#phase-1-design--planning)
2. **Data layer**: Follow [database-patterns.md](./database-patterns.md) for schema
3. **API design**: Use [api-patterns.md](./api-patterns.md)
4. **Implementation**: Use [golden-module](./examples/golden-module/README.md) as the template
5. **Validation**: Check [backend-rules.md](./backend-rules.md) architecture validation section

### Implementing Error Handling?

→ Read [error-handling.md](./error-handling.md)

### Optimizing Performance?

→ Read [database-patterns.md](./database-patterns.md#query-optimization-patterns)

### Unsure About Architecture?

→ Read [backend-rules.md](./backend-rules.md) and [module-map.md](./module-map.md)

### Writing Code?

→ Check [coding-standards.md](./coding-standards.md) for naming and formatting

---

## 🏗️ Architecture at a Glance

```
Client Request
    ↓
Route (HTTP pattern) → Controller (HTTP handling)
                         ↓
                      Service (Business Logic)
                         ↓
                      Repository (Data Access)
                         ↓
                      MongoDB (Persistence)

Error Handling: Centralized via errorMiddleware + AppError
Response Format: Standardized via ResponseBuilder
Async Handling: Wrapped via asyncHandler
```

---

## 📋 Key Files to Remember

| File                                  | Purpose                                         |
| ------------------------------------- | ----------------------------------------------- |
| `src/core/errors/AppError.ts`         | Custom error class - use for ALL errors         |
| `src/core/utils/apiResponse.ts`       | Response formatting - use for ALL responses     |
| `src/core/utils/asyncHandler.ts`      | Async wrapper - wrap all async handlers         |
| `src/config/env.ts`                   | Environment config - use for accessing env vars |
| `src/repositories/base.repository.ts` | Base class - extend for all repositories        |
| `src/middlewares/error.middleware.ts` | Global error handler - catches all errors       |
| `src/routes/index.ts`                 | Main router - mount all module routers here     |

---

## ✅ Pre-Implementation Checklist

Before implementing any feature:

- [ ] Read project-overview.md (understand the project)
- [ ] Read backend-rules.md (understand the rules)
- [ ] Read examples/golden-module (use the reference module)
- [ ] Read feature-implementation-guide.md (understand the process)
- [ ] Design your feature (endpoints, data model, dependencies)
- [ ] Check module-map.md (understand existing modules)
- [ ] Check reusable-components.md (reuse existing code)
- [ ] Plan your implementation

---

## 🔄 Keeping Documentation Updated

### When to Update .ai Folder

1. **New architectural pattern discovered**
   → Update [api-patterns.md](./api-patterns.md) or [database-patterns.md](./database-patterns.md)

2. **New utility/helper created**
   → Update [reusable-components.md](./reusable-components.md)

3. **New module/service added**
   → Update [module-map.md](./module-map.md)

4. **New naming convention established**
   → Update [coding-standards.md](./coding-standards.md)

5. **Architectural change**
   → Update [backend-rules.md](./backend-rules.md) and [folder-structure.md](./folder-structure.md)

6. **Refactoring completed**
   → Update [refactoring-opportunities.md](./refactoring-opportunities.md)

---

## 🚀 Using This with AI Assistants

### For GitHub Copilot:

```
"Before implementing [feature], refer to:
1. .ai/project-overview.md for context
2. .ai/examples/golden-module/ for the reference module
3. .ai/feature-implementation-guide.md for process
4. .ai/backend-rules.md for rules
5. .ai/api-patterns.md for API design
6. Existing code in src/ for patterns"
```

### For Code Review:

Reference the appropriate .ai document as context for why certain decisions were made.

### For Onboarding:

Point new developers to this folder for comprehensive project context.

---

## 📖 Documentation Standards

All .ai documentation follows these standards:

- **Practical**: Based on REAL project code, not theory
- **Actionable**: Includes code examples and patterns to follow
- **Complete**: Covers both happy paths and error cases
- **Maintainable**: Easy to update as architecture evolves
- **Searchable**: Clear section headings and tables of contents
- **Referenced**: Links between related documents

---

## 🎓 Learning Path for New Developers

**Day 1:**

1. Read project-overview.md (30 min)
2. Read folder-structure.md (30 min)
3. Look at actual code in src/ (1 hour)

**Day 2:**

1. Read backend-rules.md (1 hour)
2. Read coding-standards.md (30 min)
3. Try adding a simple endpoint (with guidance)

**Day 3+:**

1. Read api-patterns.md for API work
2. Read database-patterns.md for data work
3. Reference feature-implementation-guide.md when adding features

---

## 💡 Tips for Best Results

1. **Read before coding**: Most questions are answered in these docs
2. **Reference real code**: Check `src/` when examples are given
3. **Follow the guide**: [feature-implementation-guide.md](./feature-implementation-guide.md) is a step-by-step manual
4. **Check patterns**: [api-patterns.md](./api-patterns.md) and [database-patterns.md](./database-patterns.md) have proven patterns
5. **Validate architecture**: [backend-rules.md](./backend-rules.md) has validation checklist
6. **Avoid mistakes**: [refactoring-opportunities.md](./refactoring-opportunities.md) documents what NOT to do

---

## 📞 Document Structure Overview

```
.ai/
├── project-overview.md              (WHAT & WHY)
├── folder-structure.md              (WHERE & HOW)
├── backend-rules.md                 (RULES & PRINCIPLES)
├── coding-standards.md              (CODE STYLE)
├── api-patterns.md                  (API DESIGN)
├── database-patterns.md             (DATA DESIGN)
├── error-handling.md                (ERROR HANDLING)
├── reusable-components.md           (UTILITIES)
├── module-map.md                    (DEPENDENCIES)
├── feature-implementation-guide.md  (HOW-TO)
├── examples/golden-module/          (PRIMARY MODULE REFERENCE)
├── refactoring-opportunities.md     (IMPROVEMENTS)
└── README.md                        (THIS FILE)
```

---

## 🔗 Cross-References

- **Architecture questions?** → backend-rules.md + module-map.md
- **Code style questions?** → coding-standards.md
- **API design questions?** → api-patterns.md
- **Database questions?** → database-patterns.md
- **Error handling questions?** → error-handling.md
- **How to add feature?** → feature-implementation-guide.md
- **What utilities exist?** → reusable-components.md
- **Where does code go?** → folder-structure.md
- **What's the tech stack?** → project-overview.md
- **What needs refactoring?** → refactoring-opportunities.md

---

## ✨ This System Enables:

✅ **Faster Feature Development**: Step-by-step guides reduce decision time
✅ **Consistent Quality**: Rules and patterns ensure uniform code quality
✅ **Reduced Errors**: Documentation highlights common mistakes
✅ **Better Collaboration**: AI and humans speak same language
✅ **Easier Onboarding**: Complete context for new developers
✅ **Scalable Architecture**: Patterns support growth
✅ **Production Readiness**: Covers security, performance, error handling
✅ **Reduced Tech Debt**: Refactoring opportunities identified

---

**Last Updated**: 2026-05-19
**Next Review**: When first major feature is implemented

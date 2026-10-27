import { hashPassword } from "../auth/password";
import { rawQuery as query } from "./index";

export async function seedDatabase() {
  console.log("Starting Student Hub database seed...");

  // 1. Roles
  await query(`
    INSERT INTO roles (id, name, description) VALUES
      ('role-student', 'student', 'Enrolled student learner'),
      ('role-reviewer', 'reviewer', 'Academic content reviewer and educator'),
      ('role-admin', 'admin', 'System administrator')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 2. Plans
  await query(`
    INSERT INTO plans (id, name, daily_ai_limit, features) VALUES
      ('free', 'Free Student Tier', 20, $1::jsonb),
      ('pro', 'Pro Scholar Tier', 200, $2::jsonb)
    ON CONFLICT (id) DO NOTHING;
  `, [
    JSON.stringify([
      "Full access to verified Punjab Board Class 9 curriculum",
      "20 AI Tutor questions per day",
      "Unlimited topic quizzes and instant grading",
      "Study planner with deadline tracking",
    ]),
    JSON.stringify([
      "Full curriculum access across all classes",
      "200 AI Tutor questions per day",
      "In-depth step-by-step problem solver",
      "Detailed diagnostic weak-area revision reports",
    ]),
  ]);

  // 3. Initial Users (Admin, Reviewer, Student)
  const defaultPasswordHash = await hashPassword("StudentHub@2026");

  await query(`
    INSERT INTO users (id, email, password_hash, full_name, email_verified, status) VALUES
      ('user-admin-1', 'admin@studenthub.pk', $1, 'Admin Khurram Shahzad', TRUE, 'active'),
      ('user-rev-1', 'reviewer@studenthub.pk', $1, 'Prof. Ayesha Siddiqa (Subject Specialist)', TRUE, 'active'),
      ('user-std-1', 'student@studenthub.pk', $1, 'Hamza Tariq (Class 9)', TRUE, 'active')
    ON CONFLICT (id) DO NOTHING;
  `, [defaultPasswordHash]);

  // Assign roles
  await query(`
    INSERT INTO user_roles (user_id, role_id) VALUES
      ('user-admin-1', 'role-admin'),
      ('user-rev-1', 'role-reviewer'),
      ('user-std-1', 'role-student')
    ON CONFLICT DO NOTHING;
  `);

  // Assign Free plan to default users
  await query(`
    INSERT INTO user_plan_assignments (id, user_id, plan_id) VALUES
      ('plan-assign-admin', 'user-admin-1', 'pro'),
      ('plan-assign-rev', 'user-rev-1', 'pro'),
      ('plan-assign-std', 'user-std-1', 'free')
    ON CONFLICT (user_id) DO NOTHING;
  `);

  // 4. Curricula
  await query(`
    INSERT INTO curricula (id, code, name_en, name_ur, country, is_active) VALUES
      ('pk-national', 'PK-SNC', 'Pakistani National Curriculum (PCTB / Single National Curriculum)', 'قومی نصابِ پاکستان (پنجاب ٹیکسٹ بک بورڈ)', 'Pakistan', TRUE),
      ('cambridge-intl', 'CIE-O', 'Cambridge Assessment International Education (O-Level)', 'کیمبرج انٹرنیشنل اسیسمنٹ (او لیول)', 'International', FALSE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // 5. Boards
  await query(`
    INSERT INTO boards (id, curriculum_id, code, name_en, name_ur, jurisdiction, is_active) VALUES
      ('punjab-board', 'pk-national', 'BISE-PB', 'Punjab Examination Boards (Lahore, Rawalpindi, Faisalabad, Multan, Gujranwala)', 'پنجاب ایگزامینیشن بورڈز (لاہور، راولپنڈی، فیصل آباد، ملتان، گوجرانوالہ)', 'Punjab Province', TRUE),
      ('federal-board', 'pk-national', 'FBISE', 'Federal Board of Intermediate and Secondary Education (Islamabad)', 'فیڈرل بورڈ اسلام آباد', 'Federal & Cantonments', FALSE),
      ('cambridge-cie', 'cambridge-intl', 'CIE', 'Cambridge International Examinations', 'کیمبرج انٹرنیشنل', 'Global', FALSE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // 6. Academic Levels
  await query(`
    INSERT INTO academic_levels (id, code, name_en, name_ur, grade_order, is_active) VALUES
      ('class-9', '9', 'Class 9 (Matriculation Part I)', 'جماعت نہم (میٹرک حصہ اول)', 9, TRUE),
      ('class-10', '10', 'Class 10 (Matriculation Part II)', 'جماعت دہم (میٹرک حصہ دوم)', 10, FALSE),
      ('class-11', '11', 'Class 11 / First Year (Intermediate Part I)', 'جماعت گیارہویں / فرسٹ ایئر (انٹرمیڈیٹ حصہ اول)', 11, FALSE),
      ('class-12', '12', 'Class 12 / Second Year (Intermediate Part II)', 'جماعت بارہویں / سیکنڈ ایئر (انٹرمیڈیٹ حصہ دوم)', 12, FALSE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // 7. Subjects
  await query(`
    INSERT INTO subjects (id, code, name_en, name_ur, icon_name, category, is_active) VALUES
      ('math', 'MATH9', 'Mathematics (Science)', 'ریاضی (سائنس گروپ)', 'Calculator', 'science', TRUE),
      ('physics', 'PHY9', 'Physics', 'طبیعیات (فزکس)', 'Zap', 'science', TRUE),
      ('chemistry', 'CHEM9', 'Chemistry', 'کیمیا (کیمسٹری)', 'FlaskConical', 'science', TRUE),
      ('biology', 'BIO9', 'Biology', 'حیاتیات (بائیولوجی)', 'Dna', 'science', TRUE),
      ('computer-science', 'CS9', 'Computer Science', 'کمپیوٹر سائنس', 'Laptop', 'science', TRUE),
      ('english', 'ENG9', 'English (Compulsory)', 'انگریزی', 'BookOpen', 'compulsory', TRUE),
      ('urdu', 'URD9', 'Urdu (Compulsory)', 'اردو لازمی', 'Languages', 'compulsory', TRUE),
      ('pak-studies', 'PKS9', 'Pakistan Studies', 'مطالعہ پاکستان', 'Flag', 'compulsory', TRUE),
      ('islamiyat', 'ISL9', 'Islamiyat (Compulsory)', 'اسلامیات لازمی', 'Moon', 'compulsory', TRUE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // 8. Subject Offerings for Punjab Board, Class 9
  await query(`
    INSERT INTO subject_offerings (id, curriculum_id, board_id, academic_level_id, subject_id, syllabus_year, description_en, description_ur, is_verified, is_published) VALUES
      ('punjab-class9-math', 'pk-national', 'punjab-board', 'class-9', 'math', '2024-2026', 'Class 9 Science Group Mathematics per Punjab Curriculum and Textbook Board (PCTB) syllabus.', 'پنجاب ٹیکسٹ بک بورڈ کے نصاب کے مطابق جماعت نہم سائنس گروپ کی ریاضی۔', TRUE, TRUE),
      ('punjab-class9-physics', 'pk-national', 'punjab-board', 'class-9', 'physics', '2024-2026', 'Class 9 Physics covering mechanics, measurement, thermal properties and waves.', 'جماعت نہم فزکس کا نصاب، پیمائش، حرکت کے قوانین اور بنیادی اصول۔', TRUE, TRUE),
      ('punjab-class9-chemistry', 'pk-national', 'punjab-board', 'class-9', 'chemistry', '2024-2026', 'Class 9 Chemistry covering fundamentals, atomic structure, periodic table, and chemical bonding.', 'جماعت نہم کیمسٹری، مادے کی حالتیں، ایٹمی ساخت اور کیمیائی فارمولے۔', TRUE, TRUE),
      ('punjab-class9-biology', 'pk-national', 'punjab-board', 'class-9', 'biology', '2024-2026', 'Class 9 Biology exploring cell biology, bioenergetics, enzymes, and biological systems.', 'جماعت نہم بائیولوجی، خلیات، انزائمز اور جانداروں کی درجہ بندی۔', TRUE, TRUE),
      ('punjab-class9-cs', 'pk-national', 'punjab-board', 'class-9', 'computer-science', '2024-2026', 'Class 9 Computer Science covering computational thinking, flowcharts, algorithms, and networks.', 'جماعت نہم کمپیوٹر سائنس، فلوچارٹ، الگورتھم اور نیٹ ورک کے بنیادی اصول۔', TRUE, TRUE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Student academic preferences for demo student
  await query(`
    INSERT INTO student_academic_preferences (id, user_id, curriculum_id, board_id, academic_level_id, preferred_language, onboarding_completed, selected_subject_ids) VALUES
      ('pref-std-1', 'user-std-1', 'pk-national', 'punjab-board', 'class-9', 'en', TRUE, $1::jsonb)
    ON CONFLICT (user_id) DO NOTHING;
  `, [JSON.stringify(["math", "physics", "chemistry", "biology", "computer-science"])]);

  // 9. Chapters for Class 9 Mathematics
  await query(`
    INSERT INTO chapters (id, subject_offering_id, chapter_number, title_en, title_ur, description_en, description_ur, order_index) VALUES
      ('ch-math-1', 'punjab-class9-math', 1, 'Matrices and Determinants', 'قالب اور قالبوں کا مقطع', 'Introduction to rectangular arrays, types of matrices, determinants, adjoint, and solving linear equations with Cramer rule.', 'قالبوں کی اقسام، مقطع، ایڈجوائنٹ اور کرائمر کے قانون کے ذریعے مساوات حل کرنا۔', 1),
      ('ch-math-2', 'punjab-class9-math', 2, 'Real and Complex Numbers', 'حقیقی اور غیر حقیقی (پیچیدہ) اعداد', 'Properties of real numbers, radicals, exponents, and operations on complex numbers.', 'حقیقی اعداد کی خصوصیات، جذر، قوت نما اور پیچیدہ اعداد۔', 2),
      ('ch-phy-1', 'punjab-class9-physics', 1, 'Physical Quantities and Measurement', 'طبیعی مقداریں اور پیمائش', 'Base and derived quantities, SI units, scientific notation, Vernier Calipers and Micrometer Screw Gauge.', 'بنیادی اور ماخوذ مقداریں، بین الاقوامی نظام یونٹس، ورنئیر کیلیپرز اور سکریو گیج۔', 1),
      ('ch-phy-2', 'punjab-class9-physics', 2, 'Kinematics', 'حرکیات (کائنی میٹکس)', 'Rest and motion, scalar and vector quantities, distance and displacement, speed and velocity, equations of motion.', 'سکون اور حرکت، سکیلر اور ویکٹر مقداریں، فاصلہ اور ہٹاؤ، حرکت کی تین مساواتیں۔', 2),
      ('ch-chem-1', 'punjab-class9-chemistry', 1, 'Fundamentals of Chemistry', 'کیمسٹری کے بنیادی تصورات', 'Elements, compounds, mixtures, atomic number, atomic mass, ions, radicals, and Avogadro number with the mole concept.', 'عناصر، مرکبات، مکسچر، ایٹمی نمبر، مول کا تصور اور ایووگیڈرو نمبر۔', 1),
      ('ch-bio-1', 'punjab-class9-biology', 1, 'Introduction to Biology', 'حیاتیات کا تعارف', 'Divisions and branches of biology, relationship with other sciences, Quran and biology, and levels of organization.', 'حیاتیات کی اہم شاخیں، سائنسی علوم سے تعلق اور حیاتیاتی تنظیم کے درجات۔', 1),
      ('ch-cs-1', 'punjab-class9-cs', 1, 'Problem Solving', 'مسائل کا حل', 'Problem definition, analysis, flowcharts with standard symbols, algorithms design, and trace tables.', 'مسئلے کا تجزیہ، فلوچارٹ کی علامتیں، الگورتھم کی تیاری اور کارکردگی۔', 1)
    ON CONFLICT (id) DO NOTHING;
  `);

  // 10. Topics
  await query(`
    INSERT INTO topics (id, chapter_id, topic_number, title_en, title_ur, summary_en, summary_ur, order_index) VALUES
      ('top-math-1-1', 'ch-math-1', '1.1', 'Introduction to Matrices, Order, and Equality', 'قالب کا تعارف، مرتبہ اور برابری', 'Understanding rectangular arrays of numbers, rows, columns, and determining the order of matrices.', 'اعداد کی مستطیلی ترتیب، قطاریں، کالم اور قالب کا مرتبہ معلوم کرنے کا طریقہ۔', 1),
      ('top-math-1-2', 'ch-math-1', '1.2', 'Types of Matrices', 'قالبوں کی اقسام', 'Row matrix, column matrix, rectangular matrix, square matrix, zero matrix, and transpose of a matrix.', 'قطاری قالب، قالمی قالب، مستطیلی قالب، مربی قالب اور ٹرانسپوز قالب۔', 2),
      ('top-math-1-3', 'ch-math-1', '1.3', 'Determinant, Adjoint and Matrix Inverse', 'مقطع، ایڈجوائنٹ اور ضربی معکوس', 'Calculating the determinant of a 2x2 matrix, singular vs non-singular matrices, adjoint, and multiplicative inverse.', '2x2 قالب کا مقطع، نادر اور غیر نادر قالب، ایڈجوائنٹ اور معکوس معلوم کرنا۔', 3),
      ('top-math-1-4', 'ch-math-1', '1.4', 'Solving Linear Equations via Cramer Rule', 'کرائمر کے طریقے سے لکیری مساوات کا حل', 'Using determinants and Cramer rule to find unknown variables x and y in simultaneous linear equations.', 'بذریعہ مقطع اور کرائمر کا قانون دو متغیراتی مساواتوں کا حل۔', 4),
      ('top-phy-1-1', 'ch-phy-1', '1.1', 'Physical Quantities, Base and Derived Units', 'طبیعی مقداریں، بنیادی اور ماخوذ یونٹس', 'Understanding measurable characteristics, 7 fundamental SI base quantities and derived physical quantities.', 'پیمائش کے قابل خصوصیات، سات بنیادی ایس آئی یونٹس اور ماخوذ مقداریں۔', 1),
      ('top-phy-2-1', 'ch-phy-2', '2.1', 'Rest, Motion, and Types of Motion', 'سکون، حرکت اور حرکت کی اقسام', 'Distinction between rest and motion relative to observers; translatory, rotatory, and vibratory motions.', 'مشاہدے کے لحاظ سے سکون اور حرکت کا فرق؛ خطی، گردشی اور تھرتھراہٹ کی حرکت۔', 1),
      ('top-chem-1-1', 'ch-chem-1', '1.1', 'Elements, Compounds, and Mixtures', 'عناصر، مرکبات اور آمیزے', 'Difference between pure substances (elements, compounds) and heterogeneous or homogeneous mixtures.', 'خالص اشیاء (عناصر، مرکبات) اور متجانس و غیر متجانس آمیزوں میں فرق۔', 1),
      ('top-bio-1-1', 'ch-bio-1', '1.1', 'Branches of Biology and Scientific Relationships', 'حیاتیات کی شاخیں اور سائنسی علوم سے تعلق', 'Morphology, anatomy, histology, genetics, ecology, and biochemistry connecting biology with physics and chemistry.', 'مارفولوجی، اناٹومی، ہسٹولوجی، جینیٹکس اور بائیو کیمسٹری کا تعارف۔', 1),
      ('top-cs-1-1', 'ch-cs-1', '1.1', 'Problem Solving Steps and Flowcharts', 'مسئلہ حل کرنے کے مراحل اور فلوچارٹ', 'Understanding a problem, planning a solution, and drawing flowcharts using standard ISO shapes.', 'مسئلہ سمجھنا، حل کی منصوبہ بندی اور فلوچارٹ کی معیاری علامات کا استعمال۔', 1)
    ON CONFLICT (id) DO NOTHING;
  `);

  // 11. Learning Resources & Versions (Dual English and Urdu verified PCTB lessons with KaTeX formulas!)
  // Math 1.1 Resource
  await query(`
    INSERT INTO learning_resources (id, topic_id, resource_type, title_en, title_ur) VALUES
      ('res-math-1-1', 'top-math-1-1', 'lesson', 'Mastering Matrices: Rows, Columns, and Order', 'قالب کا تعارف: قطاریں، کالم اور مرتبہ')
    ON CONFLICT (id) DO NOTHING;
  `);

  const mathEnContent = `## 1. What is a Matrix?

A **matrix** is a rectangular array or a formation of a collection of real numbers, say $0, 1, 2, 3, 4, 7$, enclosed by brackets $[\\;]$.

For example:
$$A = \\begin{bmatrix} 1 & 3 & 4 \\\\ 7 & 2 & 0 \\end{bmatrix}$$

The numbers or entries inside the matrix are known as the **elements** or **entries** of the matrix.

---

## 2. Rows and Columns of a Matrix

It is essential to clearly distinguish between rows and columns:
- **Rows:** The horizontal lines of entries are called rows. In matrix $A$ above, there are $2$ horizontal rows:
  - Row 1 ($R_1$): $[1, 3, 4]$
  - Row 2 ($R_2$): $[7, 2, 0]$
- **Columns:** The vertical lines of entries are called columns. In matrix $A$, there are $3$ vertical columns:
  - Column 1 ($C_1$): $\\begin{bmatrix} 1 \\\\ 7 \\end{bmatrix}$
  - Column 2 ($C_2$): $\\begin{bmatrix} 3 \\\\ 2 \\end{bmatrix}$
  - Column 3 ($C_3$): $\\begin{bmatrix} 4 \\\\ 0 \\end{bmatrix}$

---

## 3. Order of a Matrix

The number of rows and columns in a matrix determines its **order** (or dimension).

If a matrix $M$ has $m$ rows and $n$ columns, then $M$ is said to be of order:
$$\\text{Order} = m \\times n \\quad (\\text{read as } m \\text{-by-} n)$$

> [!NOTE]
> Always state the number of rows first, followed by the number of columns.

### Example:
Let matrix $B$ be:
$$B = \\begin{bmatrix} 2 & -1 & 5 \\\\ 3 & 0 & 4 \\\\ 1 & 2 & 8 \\end{bmatrix}$$
Here, number of rows $m = 3$ and number of columns $n = 3$. Hence, the order of $B$ is **$3 \\times 3$** or $3$-by-$3$.

---

## 4. Equal Matrices

Two matrices $A$ and $B$ are said to be **equal** (written as $A = B$) if and only if:
1. The **order of $A$** is equal to the **order of $B$**.
2. Their corresponding elements are identical, i.e., $a_{ij} = b_{ij}$ for all $i$ and $j$.

### Verification Example:
If $A = \\begin{bmatrix} 1 & 3 \\\\ -4 & 2 \\end{bmatrix}$ and $B = \\begin{bmatrix} 1 & 2+1 \\\\ -4 & 4-2 \\end{bmatrix}$:
Both matrices have order $2 \\times 2$, and every corresponding element matches ($1=1$, $3=3$, $-4=-4$, $2=2$). Therefore, $A = B$.
`;

  const mathUrContent = `## ۱. قالب (Matrix) کی تعریف

حقیقی اعداد (مثلاً $0, 1, 2, 3, 4, 7$) کو مستطیلی شکل میں ترتیب دے کر بڑی بریکٹ $[\\;]$ میں بند کرنے کو **قالب** کہا جاتا ہے۔

مثال کے طور پر:
$$A = \\begin{bmatrix} 1 & 3 & 4 \\\\ 7 & 2 & 0 \\end{bmatrix}$$

قالب میں موجود اعداد کو اس کے **ارکان** (Elements) کہتے ہیں۔

---

## ۲. قالب کی قطاریں اور کالم

- **قطاریں (Rows):** قالب میں افقی سمت میں لکھے گئے ارکان کو قطاریں کہتے ہیں۔ اوپر دیے گئے قالب $A$ میں $2$ قطاریں ہیں:
  - پہلی قطار ($R_1$): $[1, 3, 4]$
  - دوسری قطار ($R_2$): $[7, 2, 0]$
- **کالم (Columns):** عمودی سمت میں لکھے گئے ارکان کو کالم کہتے ہیں۔ قالب $A$ میں $3$ عمودی کالم ہیں:
  - پہلا کالم ($C_1$): $\\begin{bmatrix} 1 \\\\ 7 \\end{bmatrix}$
  - دوسرا کالم ($C_2$): $\\begin{bmatrix} 3 \\\\ 2 \\end{bmatrix}$
  - تیسرا کالم ($C_3$): $\\begin{bmatrix} 4 \\\\ 0 \\end{bmatrix}$

---

## ۳. قالب کا مرتبہ (Order of a Matrix)

کسی قالب میں قطاروں اور کالموں کی تعداد اس کے مرتبے کو ظاہر کرتی ہے۔

اگر کسی قالب میں قطاروں کی تعداد $m$ اور کالموں کی تعداد $n$ ہو تو اس قالب کا مرتبہ کہلاتا ہے:
$$\\text{مرتبہ} = m \\times n \\quad (m\\text{-by-}n)$$

> [!IMPORTANT]
> ہمیشہ پہلے قطاروں کی تعداد ($m$) اور بعد میں کالموں کی تعداد ($n$) لکھی جاتی ہے۔

---

## ۴. مساوی قالب (Equal Matrices)

دو قالب $A$ اور $B$ اس وقت برابر یا مساوی کہلاتے ہیں اگر اور صرف اگر:
۱. قالب $A$ کا مرتبہ قالب $B$ کے مرتبے کے برابر ہو۔
۲. دونوں قالبوں کے متناظرہ (Corresponding) ارکان بالکل ایک جیسے ہوں۔
`;

  // Insert English & Urdu versions for Math 1.1
  const math11TakeawaysEn = JSON.stringify([
    "A matrix is a rectangular array of real numbers enclosed in brackets",
    "Rows are horizontal lines; columns are vertical lines",
    "Order is strictly rows-by-columns (m x n)",
    "Two matrices are equal if their order and corresponding elements are identical",
  ]);
  const math11FormulasEn = JSON.stringify([
    { name: "Matrix Order", expression: "m \\times n" },
    { name: "Matrix Equality Condition", expression: "A = B \\iff \\text{order}(A) = \\text{order}(B) \\land a_{ij} = b_{ij}" },
  ]);
  const math11TakeawaysUr = JSON.stringify([
    "قالب حقیقی اعداد کی مستطیلی ترتیب ہے جو بڑی بریکٹ میں بند ہوتی ہے",
    "افقی ارکان قطار اور عمودی ارکان کالم کہلاتے ہیں",
    "مرتبہ ہمیشہ قطار بلحاظ کالم (m-by-n) لکھا جاتا ہے",
    "دو قالب اسی وقت مساوی ہوتے ہیں جب مرتبہ اور متناظرہ ارکان برابر ہوں",
  ]);
  const math11FormulasUr = JSON.stringify([
    { name: "قالب کا مرتبہ", expression: "m \\times n" },
  ]);

  await query(`
    INSERT INTO resource_versions (id, resource_id, language, version_number, title, content_markdown, key_takeaways, formulas, source_citation, author_type, author_user_id, review_status) VALUES
      ('ver-math-1-1-en', 'res-math-1-1', 'en', 1, 'Introduction to Matrices, Order, and Equality', $1, $2::jsonb, $3::jsonb, 'Punjab Curriculum and Textbook Board (PCTB) Lahore, Mathematics Class 9 (Science), Chapter 1, pp. 2-5.', 'human', 'user-rev-1', 'approved'),
      ('ver-math-1-1-ur', 'res-math-1-1', 'ur', 1, 'قالب کا تعارف، قطاریں، کالم اور مرتبہ', $4, $5::jsonb, $6::jsonb, 'پنجاب ٹیکسٹ بک بورڈ لاہور، ریاضی جماعت نہم سائنس گروپ، باب اول، صفحات ۲ تا ۵۔', 'human', 'user-rev-1', 'approved')
    ON CONFLICT (id) DO NOTHING;
  `, [mathEnContent, math11TakeawaysEn, math11FormulasEn, mathUrContent, math11TakeawaysUr, math11FormulasUr]);

  // Publish both versions
  await query(`
    INSERT INTO resource_publications (id, resource_id, language, published_version_id, published_by_user_id, is_active) VALUES
      ('pub-math-1-1-en', 'res-math-1-1', 'en', 'ver-math-1-1-en', 'user-admin-1', TRUE),
      ('pub-math-1-1-ur', 'res-math-1-1', 'ur', 'ver-math-1-1-ur', 'user-admin-1', TRUE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // 12. Quiz for Math 1.1 (Introduction to Matrices)
  await query(`
    INSERT INTO quizzes (id, topic_id, title_en, title_ur, description_en, description_ur, time_limit_seconds, passing_percentage, is_published) VALUES
      ('quiz-math-1-1', 'top-math-1-1', 'Introduction to Matrices Quiz', 'قالب کا تعارف کویز', 'Test your understanding of matrices, rows, columns, and order.', 'قالب، قطار، کالم اور مرتبے کے بارے میں اپنی سمجھ کا اندازہ کریں۔', 600, 60, TRUE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Quiz questions
  await query(`
    INSERT INTO quiz_questions (id, quiz_id, question_number, question_text_en, question_text_ur, explanation_en, explanation_ur, points, difficulty) VALUES
      ('qq-math-1-1-1', 'quiz-math-1-1', 1, 'What is a matrix?', 'قالب کیا ہے؟', 'A matrix is a rectangular array of numbers enclosed in brackets.', 'قالب اعداد کی مستطیلی ترتیب ہے جو بریکٹ میں بند ہوتی ہے۔', 1, 'easy'),
      ('qq-math-1-1-2', 'quiz-math-1-1', 2, 'In a matrix, horizontal lines of entries are called:', 'قالب میں، افقی سمت میں لکھے گئے ارکان کو کہتے ہیں:', 'Horizontal lines in a matrix are called rows.', 'قالب میں افقی سمت کو قطار کہتے ہیں۔', 1, 'easy'),
      ('qq-math-1-1-3', 'quiz-math-1-1', 3, 'If a matrix has 3 rows and 2 columns, what is its order?', 'اگر کسی قالب میں 3 قطاریں اور 2 کالم ہوں تو اس کا مرتبہ کیا ہے؟', 'Order is stated as rows-by-columns, so 3 rows and 2 columns = 3 × 2.', 'مرتبہ قطار بلحاظ کالم لکھا جاتا ہے، تو 3 قطاریں اور 2 کالم = 3 × 2۔', 1, 'medium'),
      ('qq-math-1-1-4', 'quiz-math-1-1', 4, 'Two matrices are equal if:', 'دو قالب برابر ہوتے ہیں اگر:', 'Two matrices are equal if they have the same order and all corresponding elements are identical.', 'دو قالب اسی وقت برابر ہوتے ہیں جب ان کا مرتبہ اور تمام متناظرہ ارکان ایک جیسے ہوں۔', 1, 'medium')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Quiz options
  await query(`
    INSERT INTO question_options (id, question_id, option_key, option_text_en, option_text_ur, is_correct) VALUES
      ('qo-math-1-1-1-a', 'qq-math-1-1-1', 'A', 'A circular arrangement of numbers', 'اعداد کا دائرہ دار ترتیب', FALSE),
      ('qo-math-1-1-1-b', 'qq-math-1-1-1', 'B', 'A rectangular array of numbers', 'اعداد کی مستطیلی ترتیب', TRUE),
      ('qo-math-1-1-1-c', 'qq-math-1-1-1', 'C', 'A single number', 'ایک ہی عدد', FALSE),
      ('qo-math-1-1-1-d', 'qq-math-1-1-1', 'D', 'A vertical list of numbers', 'اعداد کی عمودی فہرست', FALSE),

      ('qo-math-1-1-2-a', 'qq-math-1-1-2', 'A', 'Columns', 'کالم', FALSE),
      ('qo-math-1-1-2-b', 'qq-math-1-1-2', 'B', 'Rows', 'قطاریں', TRUE),
      ('qo-math-1-1-2-c', 'qq-math-1-1-2', 'C', 'Diagonals', 'وتر', FALSE),
      ('qo-math-1-1-2-d', 'qq-math-1-1-2', 'D', 'Elements', 'ارکان', FALSE),

      ('qo-math-1-1-3-a', 'qq-math-1-1-3', 'A', '2 × 3', '2 × 3', FALSE),
      ('qo-math-1-1-3-b', 'qq-math-1-1-3', 'B', '3 × 2', '3 × 2', TRUE),
      ('qo-math-1-1-3-c', 'qq-math-1-1-3', 'C', '5', '5', FALSE),
      ('qo-math-1-1-3-d', 'qq-math-1-1-3', 'D', '6', '6', FALSE),

      ('qo-math-1-1-4-a', 'qq-math-1-1-4', 'A', 'They have the same number of elements', 'ان میں ارکان کی تعداد برابر ہو', FALSE),
      ('qo-math-1-1-4-b', 'qq-math-1-1-4', 'B', 'They have the same order and corresponding elements are identical', 'مرتبہ برابر ہو اور متناظرہ ارکان ایک جیسے ہوں', TRUE),
      ('qo-math-1-1-4-c', 'qq-math-1-1-4', 'C', 'They have the same first element', 'پہلا عنصر برابر ہو', FALSE),
      ('qo-math-1-1-4-d', 'qq-math-1-1-4', 'D', 'They have the same last element', 'آخری عنصر برابر ہو', FALSE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Math 1.3 Resource (Determinant and Inverse)
  await query(`
    INSERT INTO learning_resources (id, topic_id, resource_type, title_en, title_ur) VALUES
      ('res-math-1-3', 'top-math-1-3', 'lesson', 'Determinant, Adjoint and Multiplicative Inverse', 'مقطع، ایڈجوائنٹ اور ضربی معکوس')
    ON CONFLICT (id) DO NOTHING;
  `);

  const math13EnContent = `## 1. Determinant of a 2x2 Matrix

Let $A = \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$ be a $2 \\times 2$ square matrix. The **determinant** of $A$, denoted by $\\det(A)$ or $|A|$, is defined as:

$$|A| = \\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix} = ad - bc$$

### Worked Example:
Calculate the determinant of matrix $M = \\begin{bmatrix} 2 & 6 \\\\ 1 & 4 \\end{bmatrix}$:
$$|M| = (2)(4) - (6)(1) = 8 - 6 = 2$$

---

## 2. Singular vs Non-Singular Matrices

- **Singular Matrix:** A square matrix $A$ is called singular if its determinant is zero:
  $$|A| = 0$$
  *(Note: A singular matrix has no multiplicative inverse).*
- **Non-Singular Matrix:** A square matrix $A$ is called non-singular if its determinant is non-zero:
  $$|A| \\neq 0$$
  *(Only non-singular matrices possess a multiplicative inverse).*

---

## 3. Adjoint of a 2x2 Matrix

The **adjoint** of a matrix $A = \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$, denoted as $\\text{Adj}(A)$, is obtained by:
1. Interchanging the diagonal elements ($a$ and $d$).
2. Changing the signs of the other non-diagonal elements ($b$ and $c$).

$$\\text{Adj}(A) = \\begin{bmatrix} d & -b \\\\ -c & a \\end{bmatrix}$$

---

## 4. Multiplicative Inverse of a Matrix

The multiplicative inverse $A^{-1}$ exists if and only if $|A| \\neq 0$ (non-singular):

$$A^{-1} = \\frac{1}{|A|} \\text{Adj}(A) = \\frac{1}{ad - bc} \\begin{bmatrix} d & -b \\\\ -c & a \\end{bmatrix}$$

When $A$ is multiplied by its inverse $A^{-1}$, the result is the **Identity matrix** $I$:
$$A A^{-1} = A^{-1} A = I = \\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}$$
`;

  const math13UrContent = `## ۱. دو ضربی دو (2x2) قالب کا مقطع (Determinant)

اگر $A = \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$ ایک مربی قالب ہو تو اس کا **مقطع** $|A|$ درج ذیل فارمولے سے معلوم کیا جاتا ہے:

$$|A| = \\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix} = ad - bc$$

### مثال:
قالب $M = \\begin{bmatrix} 2 & 6 \\\\ 1 & 4 \\end{bmatrix}$ کا مقطع معلوم کریں:
$$|M| = (2)(4) - (6)(1) = 8 - 6 = 2$$

---

## ۲. نادر اور غیر نادر قالب

- **نادر قالب (Singular Matrix):** ایسا مربی قالب جس کا مقطع صفر کے برابر ہو ($|A| = 0$)۔ نادر قالب کا ضربی معکوس ممکن نہیں ہوتا۔
- **غیر نادر قالب (Non-Singular Matrix):** ایسا مربی قالب جس کا مقطع صفر نہ ہو ($|A| \\neq 0$)۔ صرف غیر نادر قالب کا ہی ضربی معکوس نکالا جا سکتا ہے۔

---

## ۳. ایڈجوائنٹ (Adjoint) معلوم کرنے کا طریقہ

قالب $A = \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$ کا ایڈجوائنٹ درج ذیل طریقے سے حاصل ہوتا ہے:
۱. وتر کے ارکان ($a$ اور $d$) کی جگہیں آپس میں بدل دی جاتی ہیں۔
۲. غیر وتری ارکان ($b$ اور $c$) کی علامتیں تبدیل کر دی جاتی ہیں۔

$$\\text{Adj}(A) = \\begin{bmatrix} d & -b \\\\ -c & a \\end{bmatrix}$$

---

## ۴. ضربی معکوس (Multiplicative Inverse) کا فارمولا

اگر $|A| \\neq 0$ ہو تو ضربی معکوس $A^{-1}$ درج ذیل ہے:
$$A^{-1} = \\frac{1}{|A|} \\text{Adj}(A)$$
`;

  const math13TakeawaysEn = JSON.stringify([
    "Determinant of 2x2 matrix is ad - bc",
    "Singular matrix has determinant = 0, no inverse exists",
    "Non-singular matrix has determinant != 0",
    "Inverse formula is 1/|A| * Adj(A)",
  ]);
  const math13FormulasEn = JSON.stringify([
    { name: "Determinant Formula", expression: "|A| = ad - bc" },
    { name: "Inverse Formula", expression: "A^{-1} = \\frac{1}{|A|} \\text{Adj}(A)" },
  ]);
  const math13TakeawaysUr = JSON.stringify([
    "2x2 قالب کا مقطع ad - bc ہوتا ہے",
    "نادر قالب کا مقطع صفر ہوتا ہے اور اس کا معکوس ناممکن ہے",
    "غیر نادر قالب کا مقطع غیر صفر ہوتا ہے",
    "ضربی معکوس کا فارمولا 1/|A| * Adj(A) ہے",
  ]);
  const math13FormulasUr = JSON.stringify([
    { name: "مقطع کا فارمولا", expression: "|A| = ad - bc" },
    { name: "معکوس کا فارمولا", expression: "A^{-1} = \\frac{1}{|A|} \\text{Adj}(A)" },
  ]);

  await query(`
    INSERT INTO resource_versions (id, resource_id, language, version_number, title, content_markdown, key_takeaways, formulas, source_citation, author_type, author_user_id, review_status) VALUES
      ('ver-math-1-3-en', 'res-math-1-3', 'en', 1, 'Determinant, Adjoint and Multiplicative Inverse', $1, $2::jsonb, $3::jsonb, 'Punjab Curriculum and Textbook Board (PCTB) Lahore, Class 9 Mathematics, pp. 11-16.', 'human', 'user-rev-1', 'approved'),
      ('ver-math-1-3-ur', 'res-math-1-3', 'ur', 1, 'مقطع، ایڈجوائنٹ اور ضربی معکوس', $4, $5::jsonb, $6::jsonb, 'پنجاب ٹیکسٹ بک بورڈ لاہور، ریاضی نہم، صفحات ۱۱ تا ۱۶۔', 'human', 'user-rev-1', 'approved')
    ON CONFLICT (id) DO NOTHING;
  `, [math13EnContent, math13TakeawaysEn, math13FormulasEn, math13UrContent, math13TakeawaysUr, math13FormulasUr]);

  await query(`
    INSERT INTO resource_publications (id, resource_id, language, published_version_id, published_by_user_id, is_active) VALUES
      ('pub-math-1-3-en', 'res-math-1-3', 'en', 'ver-math-1-3-en', 'user-admin-1', TRUE),
      ('pub-math-1-3-ur', 'res-math-1-3', 'ur', 'ver-math-1-3-ur', 'user-admin-1', TRUE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Physics 1.1 Resource
  await query(`
    INSERT INTO learning_resources (id, topic_id, resource_type, title_en, title_ur) VALUES
      ('res-phy-1-1', 'top-phy-1-1', 'lesson', 'Physical Quantities and SI Base Units', 'طبیعی مقداریں اور بنیادی ایس آئی یونٹس')
    ON CONFLICT (id) DO NOTHING;
  `);

  const phy11EnContent = `## 1. What are Physical Quantities?

All measurable quantities are called **physical quantities**, such as length, mass, time, and temperature. A physical quantity possesses at least two characteristics in common:
1. Its **numerical magnitude**.
2. The **unit** in which it is measured.

For example, if the height of a student is $104\\text{ cm}$, then $104$ is the numerical magnitude and 'centimetre' ($\\text{cm}$) is the unit of measurement.

---

## 2. Base vs. Derived Quantities

### Base Quantities:
Base quantities are the quantities on the basis of which other quantities are expressed. In the International System of Units (SI), there are **seven base quantities**:

| Physical Quantity | SI Unit | Symbol |
| :--- | :--- | :--- |
| Length | metre | $\\text{m}$ |
| Mass | kilogram | $\\text{kg}$ |
| Time | second | $\\text{s}$ |
| Electric Current | ampere | $\\text{A}$ |
| Thermodynamic Temperature | kelvin | $\\text{K}$ |
| Intensity of Light | candela | $\\text{cd}$ |
| Amount of Substance | mole | $\\text{mol}$ |

### Derived Quantities:
The quantities that are expressed in terms of base quantities are called derived quantities.
- **Speed ($v$):** Defined as distance per unit time ($v = \\frac{s}{t}$), unit is $\\text{m/s}$ or $\\text{m s}^{-1}$.
- **Acceleration ($a$):** Rate of change of velocity ($a = \\frac{\\Delta v}{\\Delta t}$), unit is $\\text{m/s}^2$ or $\\text{m s}^{-2}$.
- **Force ($F$):** Defined by Newton's second law ($F = ma$), unit is Newton ($\\text{N} = \\text{kg m s}^{-2}$).
- **Work / Energy ($W$):** $W = F \\cdot s$, unit is Joule ($\\text{J} = \\text{N m} = \\text{kg m}^2 \\text{s}^{-2}$).
`;

  const phy11UrContent = `## ۱. طبیعی مقداریں کیا ہیں؟

تمام قابلِ پیمائش مقداروں کو **طبیعی مقداریں** کہا جاتا ہے، جیسے لمبائی، کمیت، وقت اور درجہ حرارت۔ کسی بھی طبیعی مقدار کی دو لازمی خصوصیات ہوتی ہیں:
۱. اس کی **عددی قیمت** (Numerical Magnitude)۔
۲. وہ **یونٹ** (Unit) جس میں پیمائش کی گئی ہو۔

مثال: اگر کسی طالبعلم کا قد $104\\text{ cm}$ ہو تو $104$ عددی قیمت ہے اور سینٹی میٹر اس کا یونٹ ہے۔

---

## ۲. بنیادی اور ماخوذ مقداریں

### بنیادی مقداریں (Base Quantities):
وہ مقداریں جن کی بنیاد پر دوسری مقداریں بیان کی جائیں۔ بین الاقوامی نظام (SI) میں **۷ بنیادی مقداریں** ہیں:

| طبیعی مقدار | SI یونٹ | علامت |
| :--- | :--- | :--- |
| لمبائی | میٹر | $\\text{m}$ |
| کمیت | کلوگرام | $\\text{kg}$ |
| وقت | سیکنڈ | $\\text{s}$ |
| الیکٹرک کرنٹ | ایمپیئر | $\\text{A}$ |
| درجہ حرارت | کیلون | $\\text{K}$ |
| روشنی کی شدت | کینڈیلا | $\\text{cd}$ |
| مادے کی مقدار | مول | $\\text{mol}$ |

### ماخوذ مقداریں (Derived Quantities):
وہ مقداریں جو بنیادی مقداروں کی ضرب یا تقسیم سے حاصل کی جاتی ہیں:
- **رفتار (Speed):** $v = \\frac{s}{t}$، یونٹ $\\text{m/s}$ ہے۔
- **اسراع (Acceleration):** $a = \\frac{\\Delta v}{\\Delta t}$، یونٹ $\\text{m/s}^2$ ہے۔
- **فورس (Force):** $F = ma$، یونٹ نیوٹن ($\\text{N} = \\text{kg m/s}^2$) ہے۔
`;

  const phy11TakeawaysEn = JSON.stringify([
    "Physical quantities possess numerical magnitude and a unit",
    "There are exactly 7 base SI quantities (length, mass, time, current, temp, light intensity, amount)",
    "Derived quantities like speed, acceleration and force are combinations of base units",
  ]);
  const phy11FormulasEn = JSON.stringify([
    { name: "Speed Definition", expression: "v = \\frac{s}{t}" },
    { name: "Force Definition", expression: "F = ma" },
  ]);
  const phy11TakeawaysUr = JSON.stringify([
    "طبیعی مقدار عددی قیمت اور یونٹ پر مشتمل ہوتی ہے",
    "ایس آئی نظام میں ۷ بنیادی مقداریں ہیں",
    "ماخوذ مقداریں بنیادی مقداروں کے ملاپ سے بنتی ہیں",
  ]);
  const phy11FormulasUr = JSON.stringify([
    { name: "رفتار کا فارمولا", expression: "v = \\frac{s}{t}" },
  ]);

  await query(`
    INSERT INTO resource_versions (id, resource_id, language, version_number, title, content_markdown, key_takeaways, formulas, source_citation, author_type, author_user_id, review_status) VALUES
      ('ver-phy-1-1-en', 'res-phy-1-1', 'en', 1, 'Physical Quantities, Base and Derived Units', $1, $2::jsonb, $3::jsonb, 'Punjab Curriculum and Textbook Board (PCTB) Lahore, Physics Class 9, Chapter 1, pp. 3-8.', 'human', 'user-rev-1', 'approved'),
      ('ver-phy-1-1-ur', 'res-phy-1-1', 'ur', 1, 'طبیعی مقداریں، بنیادی اور ماخوذ یونٹس', $4, $5::jsonb, $6::jsonb, 'پنجاب ٹیکسٹ بک بورڈ لاہور، فزکس نہم، باب اول، صفحات ۳ تا ۸۔', 'human', 'user-rev-1', 'approved')
    ON CONFLICT (id) DO NOTHING;
  `, [phy11EnContent, phy11TakeawaysEn, phy11FormulasEn, phy11UrContent, phy11TakeawaysUr, phy11FormulasUr]);

  await query(`
    INSERT INTO resource_publications (id, resource_id, language, published_version_id, published_by_user_id, is_active) VALUES
      ('pub-phy-1-1-en', 'res-phy-1-1', 'en', 'ver-phy-1-1-en', 'user-admin-1', TRUE),
      ('pub-phy-1-1-ur', 'res-phy-1-1', 'ur', 'ver-phy-1-1-ur', 'user-admin-1', TRUE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // 12. Topic Quizzes with real MCQ questions and authoritative answers
  // Quiz for Math 1.1
  await query(`
    INSERT INTO quizzes (id, topic_id, title_en, title_ur, description_en, description_ur, time_limit_seconds, passing_percentage, is_published) VALUES
      ('quiz-math-1-1', 'top-math-1-1', 'Quiz: Matrices, Order and Equality', 'کوئز: قالب کا تعارف، مرتبہ اور برابری', 'Practice key board-style MCQs on order of matrices and matrix equality from Punjab Board Class 9 syllabus.', 'پنجاب بورڈ جماعت نہم کے نصاب سے قالب کے مرتبے اور مساوات پر مشتمل کثیر الانتخابی سوالات۔', 300, 60, TRUE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Questions for Math 1.1 Quiz
  await query(`
    INSERT INTO quiz_questions (id, quiz_id, question_number, question_text_en, question_text_ur, explanation_en, explanation_ur, points, difficulty) VALUES
      ('q-m11-1', 'quiz-math-1-1', 1, 'What is the order of the matrix [2, 1, 5]?', 'قالب [2, 1, 5] کا مرتبہ کیا ہے؟', 'The matrix has 1 horizontal row and 3 vertical columns. The order is rows-by-columns, which gives 1-by-3.', 'اس قالب میں ۱ افقی قطار اور ۳ عمودی کالم ہیں۔ لہٰذا مرتبہ ۱ ضرب ۳ (1-by-3) ہے۔', 1, 'easy'),
      ('q-m11-2', 'quiz-math-1-1', 2, 'If matrix A has order 2-by-3 and matrix B has order 2-by-3 with identical corresponding entries, which statement is true?', 'اگر قالب A اور B دونوں کا مرتبہ 2-by-3 ہو اور ان کے متناظرہ ارکان برابر ہوں تو کونسا بیان درست ہے؟', 'By definition, two matrices are equal if and only if both have the same order and their corresponding elements are equal.', 'تعریف کے مطابق دو قالب اسی وقت برابر ہوتے ہیں جب ان کا مرتبہ اور تمام متناظرہ ارکان مساوی ہوں۔', 1, 'easy'),
      ('q-m11-3', 'quiz-math-1-1', 3, 'How many elements are present in a matrix of order 3-by-2?', 'ایک قالب جس کا مرتبہ 3-by-2 ہو، اس میں کل کتنے ارکان ہوں گے؟', 'Total number of elements in a matrix of order m-by-n is m * n. Here 3 * 2 = 6 elements.', 'کسی قالب میں ارکان کی کل تعداد قطاروں اور کالموں کا حاصل ضرب (m * n) ہوتی ہے، یعنی 3 * 2 = 6 ارکان۔', 1, 'medium'),
      ('q-m11-4', 'quiz-math-1-1', 4, 'Which of the following represents a square matrix?', 'درج ذیل میں سے مربی قالب (Square Matrix) کون سا ہے؟', 'A square matrix is defined as a matrix having an equal number of rows and columns (e.g., 2-by-2 or 3-by-3).', 'مربی قالب ایسا قالب ہوتا ہے جس میں قطاروں اور کالموں کی تعداد برابر ہو (جیسے 2x2 یا 3x3)۔', 1, 'medium')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Options for Q1
  await query(`
    INSERT INTO question_options (id, question_id, option_key, option_text_en, option_text_ur, is_correct) VALUES
      ('opt-m11-1-a', 'q-m11-1', 'A', '3-by-1', '3-by-1', FALSE),
      ('opt-m11-1-b', 'q-m11-1', 'B', '1-by-3', '1-by-3', TRUE),
      ('opt-m11-1-c', 'q-m11-1', 'C', '1-by-1', '1-by-1', FALSE),
      ('opt-m11-1-d', 'q-m11-1', 'D', '3-by-3', '3-by-3', FALSE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Options for Q2
  await query(`
    INSERT INTO question_options (id, question_id, option_key, option_text_en, option_text_ur, is_correct) VALUES
      ('opt-m11-2-a', 'q-m11-2', 'A', 'A = B', 'A = B', TRUE),
      ('opt-m11-2-b', 'q-m11-2', 'B', 'A is transpose of B', 'A، B کا ٹرانسپوز ہے', FALSE),
      ('opt-m11-2-c', 'q-m11-2', 'C', 'A and B cannot be compared', 'ان کا موازنہ نہیں کیا جا سکتا', FALSE),
      ('opt-m11-2-d', 'q-m11-2', 'D', 'A = -B', 'A = -B', FALSE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Options for Q3
  await query(`
    INSERT INTO question_options (id, question_id, option_key, option_text_en, option_text_ur, is_correct) VALUES
      ('opt-m11-3-a', 'q-m11-3', 'A', '5', '5', FALSE),
      ('opt-m11-3-b', 'q-m11-3', 'B', '6', '6', TRUE),
      ('opt-m11-3-c', 'q-m11-3', 'C', '3', '3', FALSE),
      ('opt-m11-3-d', 'q-m11-3', 'D', '2', '2', FALSE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Options for Q4
  await query(`
    INSERT INTO question_options (id, question_id, option_key, option_text_en, option_text_ur, is_correct) VALUES
      ('opt-m11-4-a', 'q-m11-4', 'A', 'Order 1-by-2', 'مرتبہ 1-by-2', FALSE),
      ('opt-m11-4-b', 'q-m11-4', 'B', 'Order 2-by-3', 'مرتبہ 2-by-3', FALSE),
      ('opt-m11-4-c', 'q-m11-4', 'C', 'Order 2-by-2', 'مرتبہ 2-by-2', TRUE),
      ('opt-m11-4-d', 'q-m11-4', 'D', 'Order 3-by-1', 'مرتبہ 3-by-1', FALSE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Quiz for Math 1.3 (Determinant & Inverse)
  await query(`
    INSERT INTO quizzes (id, topic_id, title_en, title_ur, description_en, description_ur, time_limit_seconds, passing_percentage, is_published) VALUES
      ('quiz-math-1-3', 'top-math-1-3', 'Quiz: Determinant and Multiplicative Inverse', 'کوئز: مقطع اور ضربی معکوس', 'Practice calculations of 2x2 matrix determinant, singular matrices, and inverse.', '2x2 قالب کے مقطع، نادر قالب اور معکوس سے متعلق اہم کثیر الانتخابی سوالات۔', 300, 60, TRUE)
    ON CONFLICT (id) DO NOTHING;
  `);

  await query(`
    INSERT INTO quiz_questions (id, quiz_id, question_number, question_text_en, question_text_ur, explanation_en, explanation_ur, points, difficulty) VALUES
      ('q-m13-1', 'quiz-math-1-3', 1, 'The determinant of matrix [[3, 2], [1, 4]] is:', 'قالب [[3, 2], [1, 4]] کا مقطع ہے:', 'Determinant = (3)(4) - (2)(1) = 12 - 2 = 10.', 'مقطع = (3)(4) - (2)(1) = 12 - 2 = 10۔', 1, 'easy'),
      ('q-m13-2', 'quiz-math-1-3', 2, 'A matrix A is singular if:', 'قالب A نادر کہلاتا ہے اگر:', 'By definition, a square matrix is singular when its determinant |A| = 0.', 'تعریف کے مطابق اگر قالب کا مقطع صفر ہو (|A| = 0) تو وہ نادر قالب کہلاتا ہے۔', 1, 'easy'),
      ('q-m13-3', 'quiz-math-1-3', 3, 'If |A| = 0, what can be concluded about its inverse A^-1?', 'اگر |A| = 0 ہو، تو معکوس A^-1 کے بارے میں کیا نتیجہ نکلتا ہے؟', 'Since inverse requires division by |A|, division by zero is undefined; therefore, the inverse does not exist.', 'چونکہ معکوس کے فارمولے میں |A| سے تقسیم کیا جاتا ہے اور صفر سے تقسیم ناممکن ہے، اس لیے معکوس ممکن نہیں ہوتا۔', 1, 'medium')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Options for Math 1.3 Q1
  await query(`
    INSERT INTO question_options (id, question_id, option_key, option_text_en, option_text_ur, is_correct) VALUES
      ('opt-m13-1-a', 'q-m13-1', 'A', '10', '10', TRUE),
      ('opt-m13-1-b', 'q-m13-1', 'B', '14', '14', FALSE),
      ('opt-m13-1-c', 'q-m13-1', 'C', '6', '6', FALSE),
      ('opt-m13-1-d', 'q-m13-1', 'D', '2', '2', FALSE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Options for Math 1.3 Q2
  await query(`
    INSERT INTO question_options (id, question_id, option_key, option_text_en, option_text_ur, is_correct) VALUES
      ('opt-m13-2-a', 'q-m13-2', 'A', '|A| = 0', '|A| = 0', TRUE),
      ('opt-m13-2-b', 'q-m13-2', 'B', '|A| = 1', '|A| = 1', FALSE),
      ('opt-m13-2-c', 'q-m13-2', 'C', '|A| < 0', '|A| < 0', FALSE),
      ('opt-m13-2-d', 'q-m13-2', 'D', '|A| != 0', '|A| != 0', FALSE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Options for Math 1.3 Q3
  await query(`
    INSERT INTO question_options (id, question_id, option_key, option_text_en, option_text_ur, is_correct) VALUES
      ('opt-m13-3-a', 'q-m13-3', 'A', 'A^-1 is the identity matrix', 'A^-1 شناختی قالب بن جاتا ہے', FALSE),
      ('opt-m13-3-b', 'q-m13-3', 'B', 'A^-1 does not exist', 'A^-1 ممکن نہیں ہوتا', TRUE),
      ('opt-m13-3-c', 'q-m13-3', 'C', 'A^-1 = -A', 'A^-1 = -A ہوتا ہے', FALSE),
      ('opt-m13-3-d', 'q-m13-3', 'D', 'A^-1 is zero matrix', 'A^-1 صفری قالب بن جاتا ہے', FALSE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Quiz for Physics 1.1 (Physical Quantities)
  await query(`
    INSERT INTO quizzes (id, topic_id, title_en, title_ur, description_en, description_ur, time_limit_seconds, passing_percentage, is_published) VALUES
      ('quiz-phy-1-1', 'top-phy-1-1', 'Quiz: Physical Quantities & SI Base Units', 'کوئز: طبیعی مقداریں اور بنیادی ایس آئی یونٹس', 'Evaluate your knowledge on the 7 base SI units and derived physical units from Punjab Board Class 9 Physics.', 'پنجاب بورڈ فزکس نہم کے مطابق ۷ بنیادی مقداروں اور ماخوذ مقداروں کا جائزہ۔', 300, 60, TRUE)
    ON CONFLICT (id) DO NOTHING;
  `);

  await query(`
    INSERT INTO quiz_questions (id, quiz_id, question_number, question_text_en, question_text_ur, explanation_en, explanation_ur, points, difficulty) VALUES
      ('q-p11-1', 'quiz-phy-1-1', 1, 'Which of the following is an SI base unit?', 'درج ذیل میں سے بنیادی ایس آئی یونٹ کون سا ہے؟', 'Kilogram (kg) is one of the 7 fundamental SI base units of mass. Newton, Joule, and Pascal are derived units.', 'کلوگرام کمیت کا بنیادی ایس آئی یونٹ ہے۔ نیوٹن، جول اور پاسکل ماخوذ یونٹس ہیں۔', 1, 'easy'),
      ('q-p11-2', 'quiz-phy-1-1', 2, 'How many base units are there in the International System of Units (SI)?', 'بین الاقوامی نظام یونٹس (SI) میں بنیادی یونٹس کی تعداد کتنی ہے؟', 'The SI system defines exactly 7 base quantities: length, mass, time, electric current, temperature, light intensity, and amount of substance.', 'ایس آئی نظام میں ٹھیک ۷ بنیادی مقداریں بیان کی گئی ہیں۔', 1, 'easy'),
      ('q-p11-3', 'quiz-phy-1-1', 3, 'Which of the following is a derived quantity?', 'درج ذیل میں سے ماخوذ مقدار کون سی ہے؟', 'Speed is derived from length (distance) and time (v = s/t). Length, mass, and time are base quantities.', 'رفتار فاصلے اور وقت کے ملاپ سے ماخوذ کی گئی ہے جبکہ لمبائی، وقت اور کمیت بنیادی ہیں۔', 1, 'medium')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Options for Physics Q1
  await query(`
    INSERT INTO question_options (id, question_id, option_key, option_text_en, option_text_ur, is_correct) VALUES
      ('opt-p11-1-a', 'q-p11-1', 'A', 'Newton', 'نیوٹن', FALSE),
      ('opt-p11-1-b', 'q-p11-1', 'B', 'Kilogram', 'کلوگرام', TRUE),
      ('opt-p11-1-c', 'q-p11-1', 'C', 'Joule', 'جول', FALSE),
      ('opt-p11-1-d', 'q-p11-1', 'D', 'Watt', 'واٹ', FALSE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Options for Physics Q2
  await query(`
    INSERT INTO question_options (id, question_id, option_key, option_text_en, option_text_ur, is_correct) VALUES
      ('opt-p11-2-a', 'q-p11-2', 'A', '3', '3', FALSE),
      ('opt-p11-2-b', 'q-p11-2', 'B', '5', '5', FALSE),
      ('opt-p11-2-c', 'q-p11-2', 'C', '7', '7', TRUE),
      ('opt-p11-2-d', 'q-p11-2', 'D', '9', '9', FALSE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Options for Physics Q3
  await query(`
    INSERT INTO question_options (id, question_id, option_key, option_text_en, option_text_ur, is_correct) VALUES
      ('opt-p11-3-a', 'q-p11-3', 'A', 'Time', 'وقت', FALSE),
      ('opt-p11-3-b', 'q-p11-3', 'B', 'Length', 'لمبائی', FALSE),
      ('opt-p11-3-c', 'q-p11-3', 'C', 'Mass', 'کمیت', FALSE),
      ('opt-p11-3-d', 'q-p11-3', 'D', 'Speed', 'رفتار', TRUE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Seed initial study tasks for demo student
  await query(`
    INSERT INTO study_tasks (id, user_id, topic_id, title, description, due_date, priority, is_completed) VALUES
      ('task-std-1', 'user-std-1', 'top-math-1-1', 'Practice Matrix Order & Rows/Columns', 'Solve exercise 1.1 questions 1 to 3 from PCTB math textbook.', CURRENT_DATE + INTERVAL '1 day', 'high', FALSE),
      ('task-std-2', 'user-std-1', 'top-phy-1-1', 'Memorize 7 SI Base Quantities and Symbols', 'Review Table 1.1 in Physics book for upcoming test.', CURRENT_DATE + INTERVAL '2 days', 'medium', FALSE),
      ('task-std-3', 'user-std-1', 'top-math-1-3', 'Determinant & Inverse Formulas Revision', 'Memorize |A| = ad - bc and Adj(A) sign flips.', CURRENT_DATE + INTERVAL '3 days', 'medium', FALSE)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Seed sample bookmark
  await query(`
    INSERT INTO bookmarks (id, user_id, topic_id, notes) VALUES
      ('bm-std-1', 'user-std-1', 'top-math-1-1', 'Crucial concepts for Matric Board Board Annual Exams Question 1')
    ON CONFLICT DO NOTHING;
  `);

  // Seed sample topic progress
  await query(`
    INSERT INTO topic_progress (id, user_id, topic_id, is_completed, completed_at, last_accessed_at, view_count) VALUES
      ('prog-std-1', 'user-std-1', 'top-math-1-1', TRUE, CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP, 3)
    ON CONFLICT DO NOTHING;
  `);

  console.log("Database seeded successfully with Punjab Board Class 9 curriculum, bilingual lessons, and quizzes!");
}

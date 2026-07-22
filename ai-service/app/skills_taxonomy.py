"""
A flat taxonomy of skills the resume parser looks for. In a production
system this would live in a database and be maintained by recruiters
(so new tools/frameworks can be added without a code change), but a
static list is enough to demonstrate real NER + phrase matching.
"""

SKILL_TAXONOMY = [
    # Programming languages
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Kotlin", "Swift", "R",
    # Web / frameworks
    "React", "Angular", "Vue", "Node.js", "Express", "Django", "Flask", "FastAPI", "Next.js", "Spring Boot",
    "HTML", "CSS", "Tailwind CSS", "GraphQL", "REST API",
    # Data / ML
    "SQL", "PostgreSQL", "MongoDB", "MySQL", "Redis", "Power BI", "Excel", "Tableau", "Pandas", "NumPy",
    "TensorFlow", "PyTorch", "scikit-learn", "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
    "Data Analysis", "Data Visualization", "SPSS", "SAS",
    # DevOps / infra
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Jenkins", "Terraform", "Linux", "Git",
    # Product / marketing / soft business skills
    "Project Management", "Agile", "Scrum", "SEO", "Content Marketing", "Content", "Analytics",
    "Digital Marketing", "Social Media Marketing", "Email Marketing", "Google Analytics",
    # General
    "Communication", "Leadership", "Problem Solving", "Team Management", "Public Speaking"
]

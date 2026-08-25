"""Synthetic seed data for Cartograph demo.

Generates ~12 research documents spanning multiple departments with
intentional overlapping methods/datasets/topics for cross-disciplinary
connection discovery. All data is synthetic and clearly labeled.
"""

SEED_DOCUMENTS = [
    {
        "title": "Insider Threat Detection Using Anomaly-Based Machine Learning on Network Traffic Patterns",
        "filename": "insider_threat_ml.md",
        "department": "Cybersecurity",
        "authors": ["Dr. Priya Sharma", "Arun Nair"],
        "content": """# Insider Threat Detection Using Anomaly-Based Machine Learning on Network Traffic Patterns

## Abstract
This research proposes a novel approach to insider threat detection leveraging anomaly-based machine learning techniques applied to network traffic analysis. Using the CERT Insider Threat Dataset and Random Forest classifiers enhanced with LSTM neural networks, we achieve 94.2% detection accuracy with a false positive rate below 3%.

## Introduction
Insider threats remain one of the most challenging cybersecurity problems facing organizations. Unlike external attacks, insider threats originate from trusted users who have legitimate access to systems and data. Traditional rule-based intrusion detection systems (IDS) often fail to detect subtle behavioral anomalies that characterize insider threats.

## Methodology
We employ a hybrid machine learning approach combining Random Forest for feature selection with LSTM (Long Short-Term Memory) neural networks for temporal pattern recognition. Our pipeline processes network traffic logs, extracts behavioral features, and classifies user sessions as normal or potentially malicious.

### Dataset
We utilize the CERT Insider Threat Dataset (v6.2), which contains synthesized but realistic insider threat scenarios across multiple organizations. The dataset includes network logs, email communications, file access patterns, and HTTP activity.

### Feature Engineering
- Network traffic volume per session
- Unusual access time patterns
- Data exfiltration indicators
- Peer group deviation scores
- Resource access entropy

### Model Architecture
The LSTM network processes sequential user behavior over 30-day windows, while Random Forest provides feature importance rankings. The ensemble approach yields superior performance to either method alone.

## Results
Our hybrid model achieves:
- Accuracy: 94.2%
- Precision: 91.8%
- Recall: 96.1%
- F1-Score: 93.9%

## Related Work
This builds on the anomaly detection framework proposed by Chandola et al. and extends it to the insider threat domain using deep learning temporal analysis.

## Keywords
insider threat, anomaly detection, LSTM, Random Forest, network traffic analysis, cybersecurity, machine learning
"""
    },
    {
        "title": "Statistical Anomaly Detection in High-Dimensional Time Series Using Random Forest Ensembles",
        "filename": "statistical_anomaly_detection.md",
        "department": "Statistics",
        "authors": ["Prof. Rajesh Kumar", "Dr. Meena Iyer"],
        "content": """# Statistical Anomaly Detection in High-Dimensional Time Series Using Random Forest Ensembles

## Abstract
We present a comprehensive statistical framework for anomaly detection in high-dimensional time series data. Our approach uses Random Forest ensemble methods combined with robust statistical tests to identify distributional shifts and outliers in multivariate temporal data. Evaluated on financial and environmental datasets, our method reduces false discovery rates by 40% compared to traditional statistical process control.

## Introduction
Anomaly detection in time series data is a fundamental problem in statistics with applications spanning finance, environmental monitoring, industrial quality control, and healthcare. Classical approaches like control charts and ARIMA-based methods struggle with high-dimensional, non-stationary data.

## Methodology
### Statistical Framework
We develop a hierarchical testing framework:
1. Marginal anomaly detection using modified Grubbs tests
2. Multivariate anomaly detection using Mahalanobis distance
3. Temporal anomaly detection using change-point analysis
4. Ensemble scoring via Random Forest aggregation

### Datasets
- Financial market data (S&P 500 components, 2010-2023)
- Environmental sensor network data from IoT monitoring stations
- Synthetic datasets with injected anomalies for controlled evaluation

### Random Forest Configuration
We use 500 trees with adaptive feature sampling. The isolation forest variant provides complementary detection for clustered anomalies.

## Results
The ensemble approach achieves:
- False Discovery Rate: 2.1% (vs 8.4% for standard methods)
- Power: 97.3% for point anomalies, 89.1% for contextual anomalies
- Computational efficiency: O(n log n) per evaluation window

## Discussion
The cross-disciplinary applicability of this framework extends to network security, where behavioral anomalies share statistical properties with financial market anomalies.

## Keywords
anomaly detection, Random Forest, time series, high-dimensional statistics, ensemble methods, change-point analysis
"""
    },
    {
        "title": "Deep Learning for Protein Folding Prediction: A Transformer-Based Approach",
        "filename": "protein_folding_dl.md",
        "department": "Biotechnology",
        "authors": ["Dr. Ananya Verma", "Dr. Karthik Rajan"],
        "content": """# Deep Learning for Protein Folding Prediction: A Transformer-Based Approach

## Abstract
We present BioTransformer, a novel transformer-based architecture for protein structure prediction. By combining attention mechanisms with evolutionary sequence features from multiple sequence alignments (MSAs), our model achieves competitive performance with AlphaFold2 on CASP14 benchmark targets while requiring 60% less computational resources. The approach demonstrates how deep learning architectures from NLP can be successfully transferred to biological sequence analysis.

## Introduction
Protein structure prediction remains a grand challenge in computational biology. The recent success of AlphaFold2 demonstrated the power of attention-based deep learning, but its computational requirements limit accessibility for many research groups.

## Methodology
### Architecture
BioTransformer uses a modified transformer encoder with:
- Multi-head attention over residue pairs
- Position-aware graph neural network layers
- Evolutionary feature embeddings from MSA profiles
- Distance prediction heads for structure generation

### Training Data
- PDB (Protein Data Bank) structures (190,000 solved structures)
- UniRef90 sequence database for MSA generation
- CASP14 test targets for benchmarking

### Training Framework
We use PyTorch with distributed training across 8 NVIDIA A100 GPUs. The model trains for 72 hours on the full dataset.

## Results
- GDT-TS score: 78.4 on CASP14 targets (vs 82.1 for AlphaFold2)
- Training cost: ~$2,400 (vs ~$6,000 for comparable AlphaFold2 training)
- Inference time: 30 seconds per protein (vs 2 minutes for AlphaFold2)

## Keywords
protein folding, transformer, deep learning, computational biology, attention mechanism, structural prediction
"""
    },
    {
        "title": "Federated Learning for Privacy-Preserving Healthcare Analytics: A Multi-Hospital Study",
        "filename": "federated_learning_healthcare.md",
        "department": "Data Science",
        "authors": ["Dr. Vikram Patel", "Sarah Chen", "Dr. Priya Sharma"],
        "content": """# Federated Learning for Privacy-Preserving Healthcare Analytics: A Multi-Hospital Study

## Abstract
This study implements a federated learning framework for collaborative healthcare analytics across 12 hospitals without sharing patient data. Using differential privacy guarantees and secure aggregation protocols, we train LSTM-based predictive models for patient readmission that achieve 89.3% accuracy while maintaining HIPAA compliance. The framework uses the same anomaly detection principles applied in cybersecurity for detecting data quality issues across hospital nodes.

## Introduction
Healthcare institutions generate vast amounts of patient data, but privacy regulations (HIPAA, GDPR) prevent direct data sharing for collaborative research. Federated learning offers a paradigm where models travel to data rather than data traveling to models.

## Methodology
### Federated Architecture
- Central aggregation server with secure multi-party computation
- Hospital-local training with differential privacy (ε=1.0)
- FedAvg algorithm with adaptive learning rate scheduling
- LSTM networks for temporal patient record analysis

### Dataset (Distributed)
- 12 hospital nodes with 2.3 million patient records total
- Features: demographics, diagnosis codes, lab results, medications
- Target: 30-day hospital readmission prediction

### Anomaly Detection for Data Quality
We apply Random Forest-based anomaly detection to identify data quality issues across hospital nodes, using techniques adapted from network security anomaly detection.

## Results
- Federated model accuracy: 89.3%
- Centralized baseline: 91.2%
- Privacy budget maintained at ε=1.0 throughout training
- Data quality anomalies detected in 3 hospital nodes, improving model performance by 4.2% after correction

## Keywords
federated learning, privacy-preserving, healthcare analytics, LSTM, differential privacy, anomaly detection
"""
    },
    {
        "title": "IoT Sensor Network Optimization Using Genetic Algorithms and Edge Computing",
        "filename": "iot_sensor_optimization.md",
        "department": "Electronics",
        "authors": ["Prof. Suresh Menon", "Dr. Lakshmi Narayanan"],
        "content": """# IoT Sensor Network Optimization Using Genetic Algorithms and Edge Computing

## Abstract
We present an optimization framework for IoT sensor networks that uses genetic algorithms to optimize sensor placement, data routing, and energy consumption. Our edge computing architecture processes sensor data locally, reducing cloud bandwidth by 73% and latency by 85%. The system includes anomaly detection modules for identifying sensor failures and environmental anomalies using statistical change-point detection methods.

## Introduction
The proliferation of IoT devices in smart cities, agriculture, and industrial monitoring creates challenges in network design, energy management, and data processing. Traditional centralized architectures cannot scale to handle millions of sensors generating continuous data streams.

## Methodology
### Genetic Algorithm for Sensor Placement
- Chromosome encoding: binary sensor activation vector
- Fitness function: coverage area × data quality / energy cost
- Selection: tournament selection with elitism
- Crossover: uniform crossover with constraint repair
- Population size: 200, generations: 500

### Edge Computing Architecture
- Raspberry Pi 4 edge nodes with TensorFlow Lite
- Local anomaly detection using lightweight Random Forest models
- MQTT protocol for sensor-to-edge communication
- Apache Kafka for edge-to-cloud data streaming

### Environmental Sensor Dataset
- 500 sensor nodes across a university campus
- Temperature, humidity, air quality, noise levels
- 6 months of continuous data (2.1 billion data points)

## Results
- Network coverage: 98.7% (vs 82.3% for grid placement)
- Energy savings: 41% reduction in total network power consumption
- Anomaly detection latency: <100ms at the edge vs 2.3s for cloud-based detection

## Keywords
IoT, sensor networks, genetic algorithm, edge computing, optimization, anomaly detection, smart campus
"""
    },
    {
        "title": "Natural Language Processing for Legal Document Analysis: A BERT-Based Classification System",
        "filename": "nlp_legal_analysis.md",
        "department": "Computer Science",
        "authors": ["Dr. Ashwin Krishnan", "Neha Gupta"],
        "content": """# Natural Language Processing for Legal Document Analysis: A BERT-Based Classification System

## Abstract
We develop a BERT-based system for automated legal document analysis, including case classification, citation extraction, and precedent identification. Fine-tuned on a corpus of 50,000 Indian Supreme Court judgments, our model achieves 93.7% accuracy in case type classification and 96.2% precision in citation extraction. The system builds a knowledge graph of legal precedents that reveals hidden connections between seemingly unrelated cases.

## Introduction
Legal professionals spend significant time manually reviewing documents to identify relevant precedents and classify cases. The volume of legal documents grows exponentially, making automated analysis essential for efficient legal research.

## Methodology
### BERT Fine-tuning
- Base model: BERT-base-multilingual-cased
- Task-specific heads: classification, NER for citation extraction, relationship extraction
- Training: 50,000 Supreme Court judgments (1950-2023)
- Knowledge graph construction using extracted entities and relationships

### Knowledge Graph
- Entities: Cases, Judges, Legal Principles, Statutes, Topics
- Relationships: CITES, OVERRULES, DISTINGUISHES, APPLIES, INTERPRETS
- Graph database: Neo4j with embedding-based similarity search
- Hidden connection discovery using graph traversal and embedding similarity

### Dataset
- 50,000 Indian Supreme Court judgments
- Manual annotations for 5,000 documents (evaluation set)
- Cross-referenced with legal databases for validation

## Results
- Case classification accuracy: 93.7%
- Citation extraction precision: 96.2%
- Knowledge graph: 250,000 entities, 1.2M relationships
- Hidden connections discovered: 3,400 cross-domain legal links

## Keywords
NLP, BERT, legal analysis, knowledge graph, citation extraction, document classification, precedent identification
"""
    },
    {
        "title": "Cybersecurity Risk Assessment Framework Using Bayesian Networks and Game Theory",
        "filename": "cyber_risk_bayesian.md",
        "department": "Cybersecurity",
        "authors": ["Dr. Priya Sharma", "Prof. Amit Desai"],
        "content": """# Cybersecurity Risk Assessment Framework Using Bayesian Networks and Game Theory

## Abstract
We propose a novel cybersecurity risk assessment framework that combines Bayesian networks for probabilistic threat modeling with game-theoretic analysis for optimal defense strategy selection. Applied to a university network infrastructure, the framework identifies critical vulnerabilities and recommends resource allocation strategies that reduce expected attack damage by 67%.

## Introduction
Traditional cybersecurity risk assessment relies on qualitative scoring (e.g., CVSS) that fails to capture complex interdependencies between threats, vulnerabilities, and assets. A probabilistic approach better models the uncertainty inherent in cybersecurity.

## Methodology
### Bayesian Network Model
- Nodes: Assets, Vulnerabilities, Threats, Controls, Impacts
- Conditional probability tables derived from historical incident data and expert elicitation
- Dynamic Bayesian network for temporal threat evolution

### Game-Theoretic Defense
- Attacker-defender game formulation
- Nash equilibrium computation for optimal defense allocation
- Budget-constrained optimization across multiple defense mechanisms

### Dataset
- University network topology (5,000 nodes, 200 subnets)
- 3 years of incident response data
- NIST NVD vulnerability database
- CERT Insider Threat Dataset for internal threat scenarios

## Results
- Risk reduction: 67% decrease in expected attack damage
- False alarm rate: 12% (vs 34% for traditional IDS)
- Optimal budget allocation: 40% network security, 30% endpoint, 20% training, 10% monitoring

## Keywords
cybersecurity, risk assessment, Bayesian networks, game theory, defense optimization, threat modeling
"""
    },
    {
        "title": "Reinforcement Learning for Autonomous Robot Navigation in Dynamic Environments",
        "filename": "rl_robot_navigation.md",
        "department": "Computer Science",
        "authors": ["Dr. Ashwin Krishnan", "Ravi Sundaram"],
        "content": """# Reinforcement Learning for Autonomous Robot Navigation in Dynamic Environments

## Abstract
We present a deep reinforcement learning framework for autonomous robot navigation in dynamic, partially observable environments. Using Proximal Policy Optimization (PPO) with a custom reward shaping strategy, our agent learns to navigate complex indoor environments with moving obstacles, achieving a 97.1% success rate in simulation and 89.4% in real-world trials. The perception module uses a sensor fusion approach combining LIDAR and camera data processed through a convolutional neural network.

## Introduction
Autonomous navigation in dynamic environments remains an open challenge in robotics. Traditional path planning algorithms (A*, RRT) struggle with dynamic obstacles, while purely reactive approaches lack long-term planning capability.

## Methodology
### RL Framework
- Algorithm: Proximal Policy Optimization (PPO)
- State space: LIDAR scans + camera images (sensor fusion via CNN)
- Action space: Linear velocity, angular velocity (continuous)
- Reward: Distance to goal - collision penalty - time penalty + exploration bonus

### Sensor Fusion
- 2D LIDAR (360°, 0.5° resolution)
- RGB-D camera (640x480)
- CNN encoder: ResNet-18 backbone
- Feature concatenation with LIDAR occupancy grid

### Training
- Simulation: Gazebo with custom dynamic environments
- 10 million timesteps of training
- Curriculum learning: static → slow → fast dynamic obstacles
- Domain randomization for sim-to-real transfer

## Results
- Simulation success rate: 97.1%
- Real-world success rate: 89.4%
- Average navigation time: 23.4s (vs 31.2s for A* with replanning)
- Collision rate: 2.1% in simulation, 5.8% in real-world

## Keywords
reinforcement learning, robot navigation, PPO, sensor fusion, autonomous systems, dynamic environments
"""
    },
    {
        "title": "Genomic Data Analysis Pipeline Using Cloud Computing and Machine Learning for Cancer Biomarker Discovery",
        "filename": "genomic_cancer_biomarkers.md",
        "department": "Biotechnology",
        "authors": ["Dr. Ananya Verma", "Prof. Sanjay Reddy", "Dr. Meena Iyer"],
        "content": """# Genomic Data Analysis Pipeline Using Cloud Computing and Machine Learning for Cancer Biomarker Discovery

## Abstract
We develop a scalable cloud-based pipeline for genomic data analysis targeting cancer biomarker discovery. The pipeline processes whole-genome sequencing (WGS) data using Google Cloud Platform, employing Random Forest and gradient boosting models to identify novel biomarkers from 15,000 patient samples. Our approach integrates multi-omics data (genomic, transcriptomic, proteomic) and identifies 47 candidate biomarkers with high predictive value for early cancer detection.

## Introduction
Cancer biomarker discovery requires processing massive genomic datasets that exceed the capacity of traditional computing infrastructure. Cloud computing platforms offer the scalability needed, but require careful pipeline design to manage costs and ensure reproducibility.

## Methodology
### Cloud Architecture
- Google Cloud Platform (GCP) with Cloud Life Sciences API
- Data storage: Cloud Storage (200TB of sequencing data)
- Compute: Preemptible VMs for batch processing
- Orchestration: Cloud Workflows for pipeline management

### Machine Learning Pipeline
- Feature selection: Random Forest importance ranking
- Classification: XGBoost ensemble for biomarker prediction
- Validation: 10-fold cross-validation with independent test cohort
- Statistical testing: Bonferroni-corrected significance thresholds

### Datasets
- TCGA (The Cancer Genome Atlas): 11,000 samples across 33 cancer types
- Local hospital cohort: 4,000 samples with longitudinal follow-up
- Multi-omics integration: WGS, RNA-seq, proteomics

## Results
- Candidate biomarkers identified: 47 (12 novel)
- Prediction AUC: 0.94 for early-stage detection
- Cost efficiency: $0.03 per sample processed on GCP
- Pipeline reproducibility: 100% (containerized with Docker)

## Keywords
genomics, cancer biomarkers, cloud computing, machine learning, Random Forest, multi-omics, GCP
"""
    },
    {
        "title": "Graph Neural Networks for Social Network Analysis and Influence Prediction",
        "filename": "gnn_social_networks.md",
        "department": "Data Science",
        "authors": ["Dr. Vikram Patel", "Neha Gupta"],
        "content": """# Graph Neural Networks for Social Network Analysis and Influence Prediction

## Abstract
This research applies Graph Neural Networks (GNNs) to social network analysis, specifically for predicting information diffusion and identifying influential nodes. Using a Graph Attention Network (GAT) architecture, we model influence propagation in academic collaboration networks and Twitter, achieving 91.2% accuracy in predicting information cascade size and identifying key influencers with 88.7% precision.

## Introduction
Understanding information propagation in social networks is critical for applications ranging from viral marketing to misinformation detection. Traditional network analysis methods (centrality measures, community detection) provide structural insights but fail to capture the dynamic nature of influence.

## Methodology
### GNN Architecture
- Graph Attention Network (GAT) with 3 attention heads
- Node features: user profile, historical activity, network position
- Edge features: interaction type, frequency, recency
- Temporal graph convolution for dynamic evolution

### Knowledge Graph Construction
- Entities: Users, Posts, Topics, Communities
- Relationships: FOLLOWS, RETWEETS, CITES, CO_AUTHORS, COLLABORATES
- Embedding generation: Node2Vec + GNN-based embeddings
- Similarity search using cosine distance on learned embeddings

### Datasets
- Academic collaboration network (DBLP): 1.8M authors, 8.2M papers
- Twitter dataset: 50M tweets, 10M users
- University research collaboration graph: 2,000 researchers, 5,000 papers

## Results
- Cascade prediction accuracy: 91.2%
- Influencer identification precision: 88.7%
- Community detection NMI: 0.82
- Temporal prediction (next 7 days): 84.3% accuracy

## Keywords
graph neural networks, social network analysis, influence prediction, GAT, knowledge graph, information diffusion
"""
    },
    {
        "title": "Blockchain-Based Secure Data Sharing for Multi-Institutional Research Collaboration",
        "filename": "blockchain_research_collab.md",
        "department": "Cybersecurity",
        "authors": ["Arun Nair", "Prof. Amit Desai"],
        "content": """# Blockchain-Based Secure Data Sharing for Multi-Institutional Research Collaboration

## Abstract
We present a permissioned blockchain framework for secure research data sharing across multiple institutions. Built on Hyperledger Fabric, the system provides audit trails, access control, and data provenance for shared datasets. Smart contracts enforce data usage policies while maintaining researcher privacy. Integration with IPFS provides decentralized storage for large datasets.

## Introduction
Research collaboration increasingly requires sharing datasets across institutional boundaries. Current approaches (email, cloud drives, FTP) lack proper audit trails, access control granularity, and data provenance tracking.

## Methodology
### Blockchain Architecture
- Platform: Hyperledger Fabric (permissioned blockchain)
- Consensus: Raft ordering service
- Smart contracts: Data access policies, usage tracking, citation enforcement
- Storage: IPFS for large files, on-chain metadata and access logs

### Security Features
- Role-based access control with institutional identity
- Differential privacy for sensitive dataset queries
- Audit trail with immutable logging
- Encrypted data channels between institutions

### Integration
- REST API for researcher access
- Python SDK for programmatic data retrieval
- Jupyter notebook integration for interactive analysis
- Anomaly detection on access patterns using statistical methods

## Results
- Transaction throughput: 2,300 TPS
- Data provenance tracking: 100% accuracy
- Cross-institutional sharing: 8 universities connected
- Researcher satisfaction: 87% prefer blockchain system over traditional sharing

## Keywords
blockchain, data sharing, research collaboration, Hyperledger, security, privacy, data provenance
"""
    },
    {
        "title": "Predictive Maintenance for Industrial Equipment Using Time Series Analysis and Transfer Learning",
        "filename": "predictive_maintenance.md",
        "department": "Electronics",
        "authors": ["Prof. Suresh Menon", "Dr. Karthik Rajan"],
        "content": """# Predictive Maintenance for Industrial Equipment Using Time Series Analysis and Transfer Learning

## Abstract
We develop a predictive maintenance system for industrial equipment using time series analysis and transfer learning. A CNN-LSTM hybrid model pre-trained on vibration sensor data from wind turbines is successfully transferred to predict failures in manufacturing equipment, reducing unplanned downtime by 45%. The anomaly detection component uses the same statistical framework as our IoT sensor network research, extended with attention mechanisms.

## Introduction
Unplanned equipment failures cost the manufacturing industry an estimated $50 billion annually. Predictive maintenance using sensor data and machine learning can significantly reduce downtime and maintenance costs.

## Methodology
### Model Architecture
- CNN layers for frequency domain feature extraction
- LSTM layers for temporal dependency modeling
- Attention mechanism for identifying critical time windows
- Transfer learning from wind turbine domain to manufacturing

### Time Series Analysis
- Wavelet decomposition for multi-scale feature extraction
- Statistical change-point detection for trend analysis
- Random Forest for feature importance ranking
- Ensemble scoring combining multiple anomaly indicators

### Datasets
- NASA Turbofan Engine Degradation Dataset
- Wind turbine SCADA data (50 turbines, 3 years)
- Manufacturing line sensor data (200 machines, 18 months)

## Results
- Failure prediction accuracy: 92.7%
- False alarm rate: 4.3%
- Transfer learning effectiveness: 87.1% accuracy on target domain (vs 78.4% without transfer)
- Downtime reduction: 45%

## Keywords
predictive maintenance, time series, transfer learning, LSTM, CNN, anomaly detection, industrial IoT
"""
    },
]


def get_seed_documents() -> list[dict]:
    """Return the seed document data."""
    return SEED_DOCUMENTS

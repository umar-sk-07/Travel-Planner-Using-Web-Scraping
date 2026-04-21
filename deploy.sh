#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="trip-planner"
DEPLOYMENT_FILE="deployment.yml"

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Trip Planner Kubernetes Deployment${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found. Please install kubectl first.${NC}"
    exit 1
fi

# Check if deployment.yml exists
if [ ! -f "$DEPLOYMENT_FILE" ]; then
    echo -e "${RED}❌ $DEPLOYMENT_FILE not found in current directory${NC}"
    exit 1
fi

# Check if kubectl is connected to a cluster
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ kubectl is not connected to any cluster${NC}"
    exit 1
fi

echo -e "${GREEN}✓ kubectl is configured${NC}"
echo ""

# Check if images are updated in deployment.yml
if grep -q "umar272003/trip-planner" "$DEPLOYMENT_FILE"; then
    echo -e "${YELLOW}⚠️  WARNING: Default image registry detected!${NC}"
    echo -e "${YELLOW}   Please update image URIs in $DEPLOYMENT_FILE${NC}"
    echo -e "${YELLOW}   Search for: your-registry/trip-planner${NC}"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if secrets are updated
if grep -q "eW91ci1qd3Qta2V5LWhlcmU=" "$DEPLOYMENT_FILE"; then
    echo -e "${YELLOW}⚠️  WARNING: Default secrets detected!${NC}"
    echo -e "${YELLOW}   Please run ./encode-secrets.sh and update deployment.yml${NC}"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Deploying to Kubernetes cluster..."
echo ""

# Apply the deployment
echo -e "${YELLOW}📦 Applying manifests...${NC}"
kubectl apply -f "$DEPLOYMENT_FILE"

echo ""
echo -e "${YELLOW}⏳ Waiting for namespace to be ready...${NC}"
kubectl wait --for=jsonpath='{.status.phase}'=Active namespace/$NAMESPACE --timeout=30s

echo ""
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s

echo ""
echo -e "${YELLOW}⏳ Waiting for Redis to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=300s

echo ""
echo -e "${YELLOW}⏳ Waiting for migration job to complete...${NC}"
kubectl wait --for=condition=complete job/prisma-migrate -n $NAMESPACE --timeout=300s

echo ""
echo -e "${YELLOW}⏳ Waiting for frontend to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=frontend -n $NAMESPACE --timeout=300s

echo ""
echo -e "${YELLOW}⏳ Waiting for worker to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=worker -n $NAMESPACE --timeout=300s

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Show deployment status
echo -e "${YELLOW}📊 Deployment Status:${NC}"
kubectl get all -n $NAMESPACE

echo ""
echo -e "${YELLOW}🌐 Access Information:${NC}"

# Get service info
SERVICE_TYPE=$(kubectl get svc frontend -n $NAMESPACE -o jsonpath='{.spec.type}')

if [ "$SERVICE_TYPE" == "NodePort" ]; then
    NODE_PORT=$(kubectl get svc frontend -n $NAMESPACE -o jsonpath='{.spec.ports[0].nodePort}')
    echo "   Service Type: NodePort"
    echo "   Port: $NODE_PORT"
    
    # Try to get node IP
    if command -v minikube &> /dev/null && minikube status &> /dev/null; then
        MINIKUBE_IP=$(minikube ip)
        echo "   URL: http://$MINIKUBE_IP:$NODE_PORT"
        echo ""
        echo "   Or run: minikube service frontend -n $NAMESPACE"
    else
        echo "   Get node IP with: kubectl get nodes -o wide"
        echo "   Access at: http://<NODE_IP>:$NODE_PORT"
    fi
elif [ "$SERVICE_TYPE" == "LoadBalancer" ]; then
    echo "   Service Type: LoadBalancer"
    echo "   Waiting for external IP..."
    kubectl get svc frontend -n $NAMESPACE
    echo ""
    echo "   Run this to watch for external IP:"
    echo "   kubectl get svc frontend -n $NAMESPACE -w"
else
    echo "   Service Type: $SERVICE_TYPE"
    kubectl get svc frontend -n $NAMESPACE
fi

echo ""
echo -e "${YELLOW}📝 Useful Commands:${NC}"
echo "   View logs:        kubectl logs -f deployment/frontend -n $NAMESPACE"
echo "   Scale frontend:   kubectl scale deployment frontend --replicas=3 -n $NAMESPACE"
echo "   Get all pods:     kubectl get pods -n $NAMESPACE"
echo "   Delete all:       kubectl delete namespace $NAMESPACE"
echo ""

# Auto port-forward so the app is accessible at localhost:3000
echo -e "${GREEN}🚀 Starting port-forward...${NC}"
echo -e "   App will be available at: ${GREEN}http://localhost:3000${NC}"
echo -e "   Press ${YELLOW}Ctrl+C${NC} to stop the tunnel."
echo ""
kubectl port-forward service/frontend 3000:3000 -n $NAMESPACE

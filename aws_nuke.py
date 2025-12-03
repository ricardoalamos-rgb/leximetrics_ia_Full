import boto3
import time
from botocore.exceptions import ClientError

REGION = 'sa-east-1'

def nuke_resources():
    print(f"☢️ INICIANDO PROTOCOLO DE DESTRUCCIÓN EN {REGION}...")
    
    # Clientes
    ec2 = boto3.client('ec2', region_name=REGION)
    rds = boto3.client('rds', region_name=REGION)
    ecs = boto3.client('ecs', region_name=REGION)

    # 1. ECS CLUSTERS & SERVICES
    # Para borrar un cluster, primero hay que borrar los servicios
    print("\n📦 Eliminando ECS Clusters y Servicios...")
    clusters = ecs.list_clusters()
    for cluster_arn in clusters.get('clusterArns', []):
        cluster_name = cluster_arn.split('/')[-1]
        print(f"  Targeting Cluster: {cluster_name}")
        
        # Listar y detener servicios
        services = ecs.list_services(cluster=cluster_name)
        for service_arn in services.get('serviceArns', []):
            service_name = service_arn.split('/')[-1]
            print(f"    - Deteniendo servicio: {service_name}")
            try:
                ecs.update_service(cluster=cluster_name, service=service_name, desiredCount=0)
                ecs.delete_service(cluster=cluster_name, service=service_name, force=True)
                print(f"    ✅ Servicio eliminado: {service_name}")
            except ClientError as e:
                print(f"    ❌ Error eliminando servicio {service_name}: {e}")
        
        # Borrar cluster
        try:
            ecs.delete_cluster(cluster=cluster_name)
            print(f"  ✅ Cluster eliminado: {cluster_name}")
        except ClientError as e:
            print(f"  ❌ Error eliminando cluster {cluster_name}: {e}")

    # 2. RDS INSTANCES
    print("\n🗄️ Eliminando Bases de Datos RDS...")
    dbs = rds.describe_db_instances()
    for db in dbs.get('DBInstances', []):
        db_id = db['DBInstanceIdentifier']
        print(f"  Targeting DB: {db_id}")
        try:
            rds.delete_db_instance(
                DBInstanceIdentifier=db_id,
                SkipFinalSnapshot=True,
                DeleteAutomatedBackups=True
            )
            print(f"  ✅ Eliminación solicitada para: {db_id}")
        except ClientError as e:
            print(f"  ❌ Error eliminando DB {db_id}: {e}")

    # 3. NAT GATEWAYS
    print("\n🌐 Eliminando NAT Gateways...")
    nats = ec2.describe_nat_gateways(Filters=[{'Name': 'state', 'Values': ['available']}])
    for nat in nats.get('NatGateways', []):
        nat_id = nat['NatGatewayId']
        print(f"  Targeting NAT GW: {nat_id}")
        try:
            ec2.delete_nat_gateway(NatGatewayId=nat_id)
            print(f"  ✅ Eliminación solicitada para: {nat_id}")
        except ClientError as e:
            print(f"  ❌ Error eliminando NAT GW {nat_id}: {e}")

    # 4. ELASTIC IPs
    print("\n📍 Liberando Elastic IPs...")
    addrs = ec2.describe_addresses()
    for addr in addrs.get('Addresses', []):
        alloc_id = addr['AllocationId']
        public_ip = addr['PublicIp']
        print(f"  Targeting IP: {public_ip}")
        try:
            ec2.release_address(AllocationId=alloc_id)
            print(f"  ✅ IP liberada: {public_ip}")
        except ClientError as e:
            print(f"  ❌ Error liberando IP {public_ip}: {e}")

    print("\n🏁 PROTOCOLO DE DESTRUCCIÓN FINALIZADO (Las eliminaciones pueden tardar unos minutos en reflejarse).")

if __name__ == "__main__":
    nuke_resources()

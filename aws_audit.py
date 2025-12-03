import boto3
from botocore.exceptions import ClientError

REGIONS = ['sa-east-1', 'us-east-1']

def check_resources():
    print("🔍 INICIANDO AUDITORÍA DE AWS (Buscando costos ocultos)...")
    
    for region in REGIONS:
        print(f"\n🌐 REVISANDO REGIÓN: {region}")
        try:
            # 1. EC2 Instances
            ec2 = boto3.client('ec2', region_name=region)
            instances = ec2.describe_instances(Filters=[{'Name': 'instance-state-name', 'Values': ['running']}])
            count = 0
            for r in instances['Reservations']:
                for i in r['Instances']:
                    print(f"  🚨 EC2 RUNNING: {i['InstanceId']} ({i['InstanceType']})")
                    count += 1
            if count == 0: print("  ✅ No hay instancias EC2 corriendo.")

            # 2. NAT Gateways
            nat_gateways = ec2.describe_nat_gateways(Filters=[{'Name': 'state', 'Values': ['available']}])
            if nat_gateways['NatGateways']:
                for ng in nat_gateways['NatGateways']:
                    print(f"  🚨 NAT GATEWAY ACTIVO: {ng['NatGatewayId']} (Costo ~$30/mes + data)")
            else:
                print("  ✅ No hay NAT Gateways activos.")

            # 3. Elastic IPs (Unattached)
            addresses = ec2.describe_addresses()
            for addr in addresses['Addresses']:
                if 'InstanceId' not in addr:
                    print(f"  🚨 ELASTIC IP SIN USAR: {addr['PublicIp']} (Costo por hora)")
            
            # 4. RDS Instances
            rds = boto3.client('rds', region_name=region)
            dbs = rds.describe_db_instances()
            if dbs['DBInstances']:
                for db in dbs['DBInstances']:
                    print(f"  🚨 RDS DB ACTIVA: {db['DBInstanceIdentifier']} ({db['DBInstanceClass']}) - Status: {db['DBInstanceStatus']}")
            else:
                print("  ✅ No hay bases de datos RDS.")

            # 5. ECS Clusters
            ecs = boto3.client('ecs', region_name=region)
            clusters = ecs.list_clusters()
            if clusters['clusterArns']:
                for arn in clusters['clusterArns']:
                    print(f"  ⚠️ ECS CLUSTER: {arn.split('/')[-1]}")
            else:
                print("  ✅ No hay clusters ECS.")

        except ClientError as e:
            print(f"  ❌ Error accediendo a {region}: {e}")
        except Exception as e:
            print(f"  ❌ Error inesperado: {e}")

    print("\n🏁 AUDITORÍA COMPLETADA.")

if __name__ == "__main__":
    check_resources()

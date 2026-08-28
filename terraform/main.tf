terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}

# --------------------------------
# Find latest Ubuntu 24.04 AMI
# --------------------------------

data "aws_ami" "ubuntu" {

  most_recent = true

  filter {
    name = "name"

    values = [
      "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"
    ]
  }

  filter {
    name = "virtualization-type"

    values = ["hvm"]
  }

  owners = ["099720109477"]
}


# --------------------------------
# Security Group
# --------------------------------

resource "aws_security_group" "repairhub_sg" {

  name = "repairhub-web-sg"

  # SSH
  ingress {

    description = "SSH"

    from_port = 22
    to_port   = 22

    protocol = "tcp"

    cidr_blocks = [
      "0.0.0.0/0"
    ]
  }


  # HTTP
  ingress {

    description = "HTTP"

    from_port = 80
    to_port   = 80

    protocol = "tcp"

    cidr_blocks = [
      "0.0.0.0/0"
    ]
  }


  # Outbound traffic
  egress {

    from_port = 0
    to_port   = 0

    protocol = "-1"

    cidr_blocks = [
      "0.0.0.0/0"
    ]
  }
}


# --------------------------------
# IAM Role for EC2
# --------------------------------

resource "aws_iam_role" "repairhub_ec2_role" {

  name = "repairhub-ec2-s3-role"

  assume_role_policy = jsonencode({

    Version = "2012-10-17"

    Statement = [

      {

        Effect = "Allow"

        Principal = {

          Service = "ec2.amazonaws.com"

        }

        Action = "sts:AssumeRole"

      }

    ]

  })
}


# --------------------------------
# S3 permissions
# --------------------------------

resource "aws_iam_role_policy" "repairhub_s3_policy" {

  name = "repairhub-s3-policy"

  role = aws_iam_role.repairhub_ec2_role.id

  policy = jsonencode({

    Version = "2012-10-17"

    Statement = [

      {

        Effect = "Allow"

        Action = [

          "s3:ListBucket"

        ]

        Resource = "arn:aws:s3:::repairhub-s3-bucket"

      },

      {

        Effect = "Allow"

        Action = [

          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"

        ]

        Resource = "arn:aws:s3:::repairhub-s3-bucket/*"

      }

    ]

  })
}


# --------------------------------
# Instance Profile
# --------------------------------

resource "aws_iam_instance_profile" "repairhub_profile" {

  name = "repairhub-ec2-profile"

  role = aws_iam_role.repairhub_ec2_role.name
}


# --------------------------------
# EC2
# --------------------------------

resource "aws_instance" "repairhub" {

  ami = data.aws_ami.ubuntu.id

  instance_type = "t3.micro"

  key_name = "fa1-key"

  vpc_security_group_ids = [

    aws_security_group.repairhub_sg.id

  ]

  iam_instance_profile = aws_iam_instance_profile.repairhub_profile.name

  tags = {

    Name = "RepairHub"

  }

}


# --------------------------------
# Output
# --------------------------------

output "public_ip" {

  value = aws_instance.repairhub.public_ip

}
const fs = require('fs-extra');
const path = require('path');
const inkject = require('inkject');
const { installDependencies } = require('./dependencies');

const TEMPLATES_DIR = path.join(__dirname, '../templates');

async function generateComponent(type, configPath) {
  try {
    console.log(`\nGenerating ${type} component...`);
    
    let config = {};
    let componentName = 'Dashtable';
    let componentNameLower = 'dashtable';
    
    if (type !== 'dashtable') {
      console.log(`Reading config from: ${configPath}`);
      
      const absolutePath = path.resolve(configPath);
      delete require.cache[absolutePath];
      config = require(absolutePath);
      
      componentName = config.componentName;
      componentNameLower = componentName.toLowerCase();
      
      let mqttTopic = config.mqttTopic;
      if (typeof mqttTopic === 'string') {
        mqttTopic = mqttTopic.replace(/&#x2F;/g, '/').replace(/[<>]/g, '');
      }
      config.mqttTopic = mqttTopic;
      
      console.log(`Component: ${componentName}`);
      console.log(`MQTT Topic: ${mqttTopic}`);
      console.log(`Label: ${config.label}`);
      console.log(`Unit: ${config.unit}`);
      console.log(`Polling Interval: ${config.pollingInterval}ms`);
    }
    
    const templates = {
      state: {
        component: 'state-component.js',
        api: 'state-api.js'
      },
      deviation: {
        component: 'deviation-component.js',
        api: 'deviation-api.js'
      },
      stats: {
        component: 'stats-component.js',
        api: 'stats-api.js'
      },
      toggle: {
        component: 'toggle-component.js',
        api: 'toggle-api.js'
      },
      chart: {
        component: 'chart-component.js', 
        api: 'chart-api.js'
      },
      dashtable: {
        component: 'dashtable-component.js'
      }
    };

    const templateFiles = templates[type];
    if (!templateFiles) {
      throw new Error(`Unknown component type: ${type}`);
    }

    const targetDirs = {
      component: path.join(process.cwd(), 'src/components/microlab'),
      api: path.join(process.cwd(), 'src/app/api/microlab')
    };

    console.log('\nCreating directories...');
    for (const [key, dir] of Object.entries(targetDirs)) {
      await fs.ensureDir(dir);
      console.log(`✓ Directory created: ${dir}`);
    }

    const renderer = new inkject();

    const templateData = {
      ...config,
      componentName,
      componentNameLower,
      componentApi: componentNameLower,
      schema: config.schema ? JSON.stringify(config.schema, null, 2) : '{}',
      mqttTopic: config.mqttTopic || '',
      pollingInterval: config.pollingInterval || 2000,
      label: config.label || componentName,
      unit: config.unit || '',
      icon: config.icon || 'Activity',
      setpoint: config.setpoint,
      maxDeviation: config.maxDeviation
    };

    console.log('\nGenerating files...');
    
    for (const [key, templateFile] of Object.entries(templateFiles)) {
      try {
        const templatePath = path.join(TEMPLATES_DIR, templateFile);
        
        if (!await fs.pathExists(templatePath)) {
          console.warn(`⚠️  Template file not found: ${templatePath}`);
          continue;
        }
        
        const template = await fs.readFile(templatePath, 'utf-8');
        
        const rendered = renderer.render(template, templateData, '$&$&');

        let outputPath;
        let outputDir;
        
        if (key === 'api') {
          if (type === 'stats') {
            outputDir = path.join(targetDirs.api, componentNameLower, 'statistics');
            await fs.ensureDir(outputDir);
            outputPath = path.join(outputDir, 'route.js');
          } else {
            outputDir = path.join(targetDirs.api, componentNameLower);
            await fs.ensureDir(outputDir);
            outputPath = path.join(outputDir, 'route.js');
          }
        } else {
          if (type === 'stats') {
            outputPath = path.join(targetDirs.component, `${componentName}Statistics.js`);
          } else {
            outputPath = path.join(targetDirs.component, `${componentName}.js`);
          }
        }

        await fs.writeFile(outputPath, rendered);
        console.log(`✓ ${key} created: ${outputPath}`);
        
      } catch (fileError) {
        console.error(`❌ Failed to generate ${key}:`, fileError.message);
        throw fileError;
      }
    }

    console.log('\nInstalling dependencies...');
    try {
      await installDependencies();
      console.log('✓ Dependencies installed');
    } catch (depError) {
      console.warn('⚠️  Failed to install dependencies:', depError.message);
      console.warn('   You may need to install dependencies manually');
    }
    
    console.log('\n✅ Component generation completed!');
    
    console.log('\n📁 Generated files:');
    if (templateFiles.component) {
      if (type === 'stats') {
        console.log(`   Component: src/components/microlab/${componentName}Statistics.js`);
      } else {
        console.log(`   Component: src/components/microlab/${componentName}.js`);
      }
    }
    if (templateFiles.api) {
      if (type === 'stats') {
        console.log(`   API Route: src/app/api/microlab/${componentNameLower}/statistics/route.js`);
      } else {
        console.log(`   API Route: src/app/api/microlab/${componentNameLower}/route.js`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Generation failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    throw error;
  }
}

module.exports = { generateComponent };
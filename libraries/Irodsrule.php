<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/**
 * Irodsrule library
 *
 * @package    Yoda
 * @copyright  Copyright (c) 2017-2018, Utrecht University. All rights reserved.
 * @license    GPLv3, see LICENSE.
 */
class Irodsrule
{
    public $CI;

    private $account;
    private $name;
    private $inputParameters = array();
    private $outputParameters = array();
    private $rule;

    public function __construct()
    {
        // Get the CI instance
        $this->CI =& get_instance();
    }

    public function make($name, $inputParameters = null, $outputParameters = null)
    {
        // Remove all input & output params
        $this->removeParameters();

        $this->account = $this->CI->rodsuser->getRodsAccount();
        $this->name = $name;
        $this->addInputParameters($inputParameters);
        $this->addOutputParameters($outputParameters);

        return $this;
    }

    public function addInputParameters($parameters)
    {
        return $this->addParameters($parameters);
    }

    public function addOutputParameters($parameters)
    {
        return $this->addParameters($parameters, 'output');
    }

    public function execute()
    {
        $output = array();
        $params = array_merge(array_keys($this->inputParameters), $this->outputParameters);

        if (count($params) > 0) {
            $body = '
                myRule {
                    ' . $this->castParameters() . '
                    ' . $this->name .'(' . implode(", ", $params) . ');
                }
            ';
        } else {
            $body = '
                myRule {
                    ' .  $this->name .';
                }
            ';
        }

        try {
            $this->rule = new ProdsRule(
                $this->account,
                $body,
                $this->inputParameters,
                $this->outputParameters
            );

            $ruleResult = $this->rule->execute();
            foreach ($this->outputParameters as $parameter) {
                if (isset($ruleResult[$parameter])) {
                    $result = json_decode($ruleResult[$parameter], true);
                    if (empty($result)) {
                        $output[$parameter] = $ruleResult[$parameter];
                    } else {
                        $output[$parameter] = json_decode($ruleResult[$parameter], true);
                    }
                }
            }

            return $output;

        } catch(RODSException $e) {
            return array('*status' => 'error', '*statusInfo' => 'Unexpected error at ' . date('d F Y H:i') . '. Please contact an administrator.');
        }
    }

    private function addParameters($parameters, $type = 'input')
    {
        $parametersType = $type . 'Parameters';

        if (!empty($parameters) && is_array($parameters)) {
            $this->{$parametersType} = array_merge($parameters, $this->{$parametersType});
            return true;
        }

        return false;
    }

    private function removeParameters()
    {
        $this->inputParameters = array();
        $this->outputParameters = array();

        return true;
    }

    private function castParameters()
    {
        $output = '';
        foreach ($this->inputParameters as $parameter => $value) {
            // Cast to integer
            if (is_int($value)) {
                $output .= $parameter . ' = int(' . $parameter . ');' . PHP_EOL;
            }
        }

        return $output;
    }
}